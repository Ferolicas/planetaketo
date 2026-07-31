#!/usr/bin/env python3
"""Provisiona el catalogo de Planeta Keto en Hotmart mediante sus APIs.

No contiene credenciales. Reutiliza el JWT de una sesion ya autenticada en el
panel (Chrome con CDP en 127.0.0.1:9223) y deja el estado operacional en /tmp.
La interfaz de Hotmart no se usa para crear, editar ni aprobar productos.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import mimetypes
import os
import shlex
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from pathlib import Path
from typing import Any

from playwright.sync_api import Page, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "catalog.json"
MANIFEST_PATH = ROOT / "data" / "hotmart-products.json"
STATE_PATH = Path("/tmp/planetaketo-hotmart-state.json")
PDF_DIR = Path("/tmp/planetaketo-hotmart-pdfs")
BUNDLE_DIR = Path("/tmp/planetaketo-hotmart-bundles")
GATEWAY_PLACEHOLDER = Path("/tmp/ENTREGA_POR_EMAIL_PLANETA_KETO.pdf")
CDP_URL = os.environ.get("HOTMART_CDP_URL", "http://127.0.0.1:9223")
PRODUCT_API_V1 = "https://api-product.vulcano.hotmart.com/product/v1/"
PRODUCT_API_V2 = "https://api-product.vulcano.hotmart.com/product/v2/"
CONTENT_API_V1 = "https://api-vlc.hotmart.com/marketplace/rest/v1/product/"
CONTENT_CONFIG = (
    "https://api-vlc.hotmart.com/marketplace/rest/v3/product/{product_id}/content/config"
)
SANITY_QUERY = (
    '*[_type == "product" && defined(slug.current)]'
    '{"slug":slug.current,"pdfUrl":pdfFile.asset->url,'
    '"fileName":pdfFile.asset->originalFilename}'
)


def log(message: str) -> None:
    print(message, flush=True)


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return " ".join(value.casefold().split())


def load_catalog() -> dict[str, Any]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"products": {}}
    return json.loads(STATE_PATH.read_text(encoding="utf-8"))


def save_state(state: dict[str, Any]) -> None:
    temporary = STATE_PATH.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    temporary.replace(STATE_PATH)


def browser_token(page: Page) -> str:
    raw = page.evaluate("localStorage.getItem('token')")
    if not raw:
        raise RuntimeError("La sesion de Hotmart no contiene token")
    try:
        parsed = json.loads(raw)
        return (
            parsed.get("access_token")
            or parsed.get("token")
            or parsed.get("id_token")
            or raw
        )
    except json.JSONDecodeError:
        return raw


def api_request(
    url: str,
    token: str,
    *,
    method: str = "GET",
    payload: bytes | None = None,
    content_type: str | None = "application/json",
    timeout: int = 90,
) -> tuple[int, bytes]:
    headers = {
        "Authorization": f"Bearer {token}",
        "Origin": "https://app.hotmart.com",
        "Referer": "https://app.hotmart.com/",
    }
    if content_type:
        headers["Content-Type"] = content_type
    request = urllib.request.Request(
        url, data=payload, method=method, headers=headers
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def api_json(
    url: str,
    token: str,
    *,
    method: str = "GET",
    body: Any | None = None,
    timeout: int = 90,
) -> Any:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    status, raw = api_request(
        url, token, method=method, payload=payload, timeout=timeout
    )
    if status // 100 != 2:
        message = raw.decode("utf-8", "replace")[:1000]
        raise RuntimeError(f"{method} {url} -> {status}: {message}")
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw.decode("utf-8", "replace").strip()


def list_products(token: str) -> list[dict[str, Any]]:
    result = api_json(f"{PRODUCT_API_V2}product?page=1&rows=200", token)
    return result.get("data", [])


def list_content(product_id: int, token: str) -> list[dict[str, Any]]:
    return api_json(f"{CONTENT_API_V1}{product_id}/content", token)


def upload_cover(image: Path, token: str) -> dict[str, Any]:
    boundary = f"----PlanetaKeto{uuid.uuid4().hex}"
    mime = mimetypes.guess_type(image.name)[0] or "image/jpeg"
    head = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="data"; filename="{image.name}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode("utf-8")
    payload = head + image.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    status, raw = api_request(
        f"{PRODUCT_API_V1}product/photo",
        token,
        method="POST",
        payload=payload,
        content_type=f"multipart/form-data; boundary={boundary}",
    )
    if status // 100 != 2:
        raise RuntimeError(
            f"No se pudo subir {image.name}: {status} "
            f"{raw.decode('utf-8', 'replace')[:1000]}"
        )
    cover = json.loads(raw)
    return {"type": mime, **cover}


def product_description(product: dict[str, Any]) -> str:
    if "includes" in product:
        return (
            f"{product['title']} es un pack digital de Planeta Keto. "
            "Incluye todos los libros indicados en la tienda dentro de un unico "
            "archivo ZIP, acceso de por vida y lectura desde movil, tablet u "
            "ordenador. Contenido educativo general; no sustituye la valoracion "
            "individual de un profesional sanitario."
        )
    goal = str(product.get("for") or "contenido practico y aplicable")
    kind = str(product.get("kind") or "producto digital")
    return (
        f"{product['title']} es un {kind} digital de Planeta Keto para {goal.lower()}. "
        "Incluye el material completo en PDF, acceso de por vida y lectura desde movil, "
        "tablet u ordenador. Contenido educativo general; no sustituye la valoracion "
        "individual de un profesional sanitario."
    )


def cover_id(product: dict[str, Any]) -> str:
    includes = product.get("includes")
    if not includes:
        return str(product["id"])
    if includes == ["ALL"]:
        return "met-keto"
    return str(includes[0])


def create_product(product: dict[str, Any], token: str) -> dict[str, Any]:
    image = ROOT / "public" / "catalog" / f"{cover_id(product)}.jpg"
    if not image.is_file():
        raise RuntimeError(f"Falta la portada {image}")
    cover = upload_cover(image, token)
    ucode = str(uuid.uuid4())
    payload = {
        "productDetail": {
            "ucode": ucode,
            "name": product["title"],
            "description": product_description(product),
            "contentLocale": "ES",
            "targetCountry": "200",
            "category": 9,
            "coverPhoto": cover,
            "format": {"id": 4},
        },
        "donationDTO": {"enable": False},
        "offerPayment": {
            "warranty": 15,
            "paymentMode": "PAY_IN_FULL",
            "checkoutConfiguration": {"vatValueEmbedded": False},
            "shoppingCartOpenPermanent": None,
            "detail": {
                "value": {"currencyCode": "EUR", "value": product["price"]},
                "installmentCustomizationEnabled": False,
                "disableConversion": False,
                "lotOffer": {},
                "recoveryWithSmartInstallments": False,
                "smartInstallmentTermsAgreed": False,
                "maxInstallmentsRecovery": None,
                "buyerInstallmentInterestRate": None,
            },
        },
    }
    returned_ucode = api_json(
        f"{PRODUCT_API_V1}product", token, method="POST", body=payload
    )
    if returned_ucode and returned_ucode != ucode:
        raise RuntimeError(f"Hotmart devolvio un ucode inesperado para {product['slug']}")
    return {"ucode": ucode, "title": product["title"]}


def map_catalog_products(
    catalog: dict[str, Any], remote: list[dict[str, Any]]
) -> dict[str, dict[str, Any]]:
    by_name = {normalize_name(item["name"]): item for item in remote}
    mapped: dict[str, dict[str, Any]] = {}
    for product in catalog["products"]:
        if product["slug"] == "metodo-keto":
            match = next((item for item in remote if item["id"] == 6135067), None)
        else:
            match = by_name.get(normalize_name(product["title"]))
        if match:
            mapped[product["slug"]] = {
                "productId": match["id"],
                "ucode": match["ucode"],
                "title": match["name"],
                "status": match["status"],
            }
    return mapped


def map_catalog_bundles(
    catalog: dict[str, Any], remote: list[dict[str, Any]]
) -> dict[str, dict[str, Any]]:
    by_name = {normalize_name(item["name"]): item for item in remote}
    mapped: dict[str, dict[str, Any]] = {}
    for bundle in catalog["bundles"]:
        match = by_name.get(normalize_name(bundle["title"]))
        if match:
            mapped[bundle["slug"]] = {
                "productId": match["id"],
                "ucode": match["ucode"],
                "title": match["name"],
                "status": match["status"],
            }
    return mapped


def map_all_catalog_items(
    catalog: dict[str, Any], remote: list[dict[str, Any]]
) -> dict[str, dict[str, Any]]:
    return {
        **map_catalog_products(catalog, remote),
        **map_catalog_bundles(catalog, remote),
    }


def command_create(page: Page, token: str, workers: int) -> None:
    catalog = load_catalog()
    state = load_state()
    remote = list_products(token)
    mapped = map_catalog_products(catalog, remote)
    state["products"].update(mapped)
    missing = [p for p in catalog["products"] if p["slug"] not in mapped]
    log(f"CREATE encontrados={len(mapped)} faltantes={len(missing)}")
    if missing:
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(create_product, item, token): item for item in missing}
            for future in concurrent.futures.as_completed(futures):
                item = futures[future]
                result = future.result()
                state["products"][item["slug"]] = result
                save_state(state)
                log(f"CREATED {item['slug']} ucode={result['ucode']}")

    expected = len(catalog["products"])
    for _ in range(20):
        remote = list_products(token)
        mapped = map_catalog_products(catalog, remote)
        if len(mapped) == expected:
            break
        time.sleep(2)
    if len(mapped) != expected:
        missing_names = [
            item["slug"] for item in catalog["products"] if item["slug"] not in mapped
        ]
        raise RuntimeError(f"Hotmart aun no indexa: {missing_names}")
    state["products"].update(mapped)
    save_state(state)
    log(f"CREATE_OK total={len(mapped)}")


def sanity_assets() -> dict[str, dict[str, str]]:
    params = urllib.parse.urlencode({"query": SANITY_QUERY})
    url = (
        "https://nfqa4osj.api.sanity.io/v2021-10-21/data/query/production?"
        + params
    )
    with urllib.request.urlopen(url, timeout=60) as response:
        items = json.load(response)["result"]
    assets = {item["slug"]: item for item in items if item.get("pdfUrl")}
    if len(assets) >= 25:
        return assets

    # Los productos nuevos viven en el dataset privado. Consultamos desde el
    # VPS, que ya posee SANITY_API_TOKEN, sin copiar ni imprimir el secreto.
    javascript = (
        'const p=process.env.SANITY_PROJECT_ID,d=process.env.SANITY_DATASET||"production",'
        't=process.env.SANITY_API_TOKEN,q=' + json.dumps(SANITY_QUERY) + ';'
        'const u=new URL("https://"+p+".api.sanity.io/v2021-10-21/data/query/"+d);'
        'u.searchParams.set("query",q);'
        'fetch(u,{headers:t?{Authorization:"Bearer "+t}:{}})'
        '.then(r=>r.json()).then(j=>console.log(JSON.stringify(j.result)))'
    )
    remote_command = (
        "cd /apps/planetaketo && DOTENV_CONFIG_PATH=.env.local "
        "node -r dotenv/config -e " + shlex.quote(javascript)
    )
    result = subprocess.run(
        ["ssh", "vps", remote_command],
        check=True,
        capture_output=True,
        text=True,
        timeout=120,
    )
    items = json.loads(result.stdout)
    return {item["slug"]: item for item in items if item.get("pdfUrl")}


def download_pdf(product: dict[str, Any], asset: dict[str, str]) -> Path:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    target = PDF_DIR / f"{product['slug']}.pdf"
    if target.is_file() and target.stat().st_size > 0:
        return target
    temporary = target.with_suffix(".part")
    with urllib.request.urlopen(asset["pdfUrl"], timeout=180) as response:
        temporary.write_bytes(response.read())
    temporary.replace(target)
    return target


def bridge_file(page: Page, path: Path) -> None:
    page.evaluate(
        """() => {
          document.getElementById('codex-hotmart-upload')?.remove();
          const input = document.createElement('input');
          input.type = 'file';
          input.id = 'codex-hotmart-upload';
          input.style.display = 'none';
          document.body.appendChild(input);
        }"""
    )
    page.set_input_files("#codex-hotmart-upload", str(path))


def upload_file_via_api(page: Page, product_id: int) -> dict[str, Any]:
    return page.evaluate(
        """async ({productId}) => {
          let webpackRequire;
          self.webpackChunk_hotmart_app_product.push([
            [Math.floor(Math.random() * 1e9)], {}, require => { webpackRequire = require; }
          ]);
          const Uploader = webpackRequire(42523);
          const file = document.getElementById('codex-hotmart-upload').files[0];
          const raw = localStorage.getItem('token');
          let token = raw;
          try {
            const parsed = JSON.parse(raw);
            token = parsed.access_token || parsed.token || parsed.id_token || raw;
          } catch {}
          let resolveUpload;
          let rejectUpload;
          const completed = new Promise((resolve, reject) => {
            resolveUpload = resolve;
            rejectUpload = reject;
          });
          const uploader = await Uploader
            .setCallbackEnqueued(() => {})
            .setCallbackStart(() => {})
            .setCallbackProgress(() => {})
            .setCallbackSuccess((info, response) => resolveUpload({info, response}))
            .setCallbackFailure((info, error) => rejectUpload(
              new Error(typeof error === 'string' ? error : JSON.stringify(error))
            ))
            .build({
              config: {
                url: `https://api-vlc.hotmart.com/marketplace/rest/v3/product/${productId}/content/config`,
                type: 'EBOOK'
              },
              accessToken: token,
              system: ''
            }, false);
          uploader.send(file, {metaData: {type: 'ebook'}});
          const result = await Promise.race([
            completed,
            new Promise((_, reject) => setTimeout(() => reject(new Error('upload_timeout')), 300000))
          ]);
          return {
            id: result.response?.id,
            name: result.response?.name,
            size: result.response?.size
          };
        }""",
        {"productId": product_id},
    )


def command_upload(page: Page, token: str) -> None:
    catalog = load_catalog()
    assets = sanity_assets()
    state = load_state()
    remote = list_products(token)
    mapped = map_catalog_products(catalog, remote)
    if len(mapped) != len(catalog["products"]):
        raise RuntimeError("Ejecuta primero el modo create")
    state["products"].update(mapped)
    save_state(state)

    downloads: dict[str, Path] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {}
        for product in catalog["products"]:
            asset = assets.get(product["slug"])
            if not asset:
                raise RuntimeError(f"Sanity no tiene PDF para {product['slug']}")
            futures[pool.submit(download_pdf, product, asset)] = product["slug"]
        for future in concurrent.futures.as_completed(futures):
            downloads[futures[future]] = future.result()
    log(f"DOWNLOAD_OK total={len(downloads)}")

    for index, product in enumerate(catalog["products"], start=1):
        mapped_product = mapped[product["slug"]]
        product_id = int(mapped_product["productId"])
        contents = list_content(product_id, token)
        # Los tres productos preparados antes del lote pueden conservar el nombre
        # original. Para los nuevos, cualquier archivo implica que el paso termino.
        if contents:
            log(f"UPLOAD_SKIP {index}/25 {product['slug']} files={len(contents)}")
            continue
        bridge_file(page, downloads[product["slug"]])
        result = upload_file_via_api(page, product_id)
        log(
            f"UPLOADED {index}/25 {product['slug']} "
            f"id={result.get('id')} size={result.get('size')}"
        )
    log("UPLOAD_OK total=25")


def command_approve(token: str) -> None:
    catalog = load_catalog()
    remote = list_products(token)
    mapped = map_catalog_products(catalog, remote)
    if len(mapped) != len(catalog["products"]):
        raise RuntimeError("No estan creados todos los productos")
    for index, product in enumerate(catalog["products"], start=1):
        item = mapped[product["slug"]]
        if item["status"] == "ACTIVE":
            log(f"APPROVE_SKIP {index}/25 {product['slug']} ACTIVE")
            continue
        if not list_content(int(item["productId"]), token):
            raise RuntimeError(f"No se aprueba {product['slug']}: no tiene PDF")
        api_json(
            f"{PRODUCT_API_V1}product/{item['productId']}/approval",
            token,
            method="POST",
            body={},
        )
        log(f"APPROVED {index}/25 {product['slug']}")
    log("APPROVE_OK")


def command_status(token: str) -> None:
    catalog = load_catalog()
    remote = list_products(token)
    mapped = map_all_catalog_items(catalog, remote)
    products = [*catalog["products"], *catalog["bundles"]]
    problems: list[str] = []
    for index, product in enumerate(products, start=1):
        item = mapped.get(product["slug"])
        if not item:
            log(f"MISSING {product['slug']}")
            problems.append(f"{product['slug']}: missing")
            continue
        contents = list_content(int(item["productId"]), token)
        pricing = api_json(
            f"{PRODUCT_API_V1}product/{item['productId']}/pricing", token
        )
        detail = pricing.get("detail", {})
        price = float(detail.get("value", {}).get("value", -1))
        placeholder_ok = (
            len(contents) == 1
            and contents[0].get("name") == "ENTREGA_POR_EMAIL_PLANETA_KETO.pdf"
        )
        if item["status"] != "ACTIVE":
            problems.append(f"{product['slug']}: {item['status']}")
        if not placeholder_ok:
            problems.append(f"{product['slug']}: contenido={len(contents)}")
        if abs(price - float(product["price"])) > 0.001:
            problems.append(
                f"{product['slug']}: precio={price} esperado={product['price']}"
            )
        log(
            f"STATUS {index}/{len(products)} {product['slug']} id={item['productId']} "
            f"status={item['status']} files={len(contents)} "
            f"price={price:g} offer={detail.get('offerKey')}"
        )
    if problems:
        raise RuntimeError("; ".join(problems))
    log(f"STATUS_OK total={len(products)}")


def build_gateway_placeholder() -> Path:
    """Genera un PDF minimo: Hotmart cobra, Planeta Keto entrega por email."""
    lines = [
        "PLANETA KETO",
        "Tu compra se entrega por correo electronico",
        "",
        "Hotmart procesa el pago de forma segura.",
        "El libro o pack comprado no se descarga desde Hotmart.",
        "Recibiras el enlace oficial de Planeta Keto en tu email.",
        "El enlace permite un maximo de 2 descargas durante 30 dias.",
        "",
        "Ayuda: info@planetaketo.es",
    ]
    escaped = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in lines]
    text_commands = ["BT", "/F1 18 Tf", "72 748 Td"]
    for index, line in enumerate(escaped):
        if index == 1:
            text_commands.extend(["0 -36 Td", "/F1 13 Tf"])
        elif index > 1:
            text_commands.append("0 -22 Td")
        text_commands.append(f"({line}) Tj")
    text_commands.append("ET")
    stream = ("\n".join(text_commands) + "\n").encode("ascii")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"endstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref}\n%%EOF\n"
        ).encode("ascii")
    )
    GATEWAY_PLACEHOLDER.write_bytes(output)
    return GATEWAY_PLACEHOLDER


def command_gateway_only(page: Page, token: str) -> None:
    """Sustituye archivos comerciales por un aviso; la app hace la entrega real."""
    catalog = load_catalog()
    mapped = map_all_catalog_items(catalog, list_products(token))
    expected = len(catalog["products"]) + len(catalog["bundles"])
    if len(mapped) != expected:
        raise RuntimeError(f"No se mapearon los {expected} productos de Hotmart")
    placeholder = build_gateway_placeholder()

    for index, (slug, item) in enumerate(mapped.items(), start=1):
        product_id = int(item["productId"])
        contents = list_content(product_id, token)
        placeholders = [
            content
            for content in contents
            if content.get("name") == GATEWAY_PLACEHOLDER.name
        ]
        if not placeholders:
            bridge_file(page, placeholder)
            upload_file_via_api(page, product_id)
            contents = list_content(product_id, token)
            placeholders = [
                content
                for content in contents
                if content.get("name") == GATEWAY_PLACEHOLDER.name
            ]
        if len(placeholders) != 1:
            raise RuntimeError(f"Placeholder inesperado en {slug}: {len(placeholders)}")

        keep_id = str(placeholders[0]["id"])
        for content in contents:
            file_id = str(content.get("id"))
            if file_id == keep_id:
                continue
            api_json(
                f"{CONTENT_API_V1}{product_id}/content/{file_id}",
                token,
                method="DELETE",
            )
        remaining = list_content(product_id, token)
        if len(remaining) != 1 or str(remaining[0].get("id")) != keep_id:
            raise RuntimeError(f"Hotmart conserva contenido comercial en {slug}")
        log(f"GATEWAY_ONLY {index}/{expected} {slug}")

    remote = list_products(token)
    current = map_all_catalog_items(catalog, remote)
    inactive = [slug for slug, item in current.items() if item["status"] != "ACTIVE"]
    if inactive:
        raise RuntimeError(f"Productos inactivos tras sustituir contenido: {inactive}")
    log(f"GATEWAY_ONLY_OK total={len(current)}")


def command_update_legacy(token: str) -> None:
    catalog = load_catalog()
    product = next(item for item in catalog["products"] if item["slug"] == "metodo-keto")
    product_id = 6135067
    info = api_json(f"{PRODUCT_API_V1}product/{product_id}/basic-information", token)
    info_payload = {
        "name": product["title"],
        "contentLocale": info["contentLocale"],
        "targetCountry": info["targetCountry"],
        "ucode": info["ucode"],
        "categoryId": info["categoryId"],
        "subcategoryId": info["subcategoryId"],
        "description": product_description(product),
    }
    api_json(
        f"{PRODUCT_API_V1}product/{product_id}/basic-information",
        token,
        method="PUT",
        body=info_payload,
    )

    pricing = api_json(f"{PRODUCT_API_V1}product/{product_id}/pricing", token)
    detail = pricing["detail"]
    pricing_payload = {
        "paymentMode": pricing["paymentMode"],
        "shoppingCartOpenPermanent": None,
        "checkoutConfiguration": detail.get("checkoutConfiguration")
        or {"vatValueEmbedded": False},
        "detail": {
            "offerId": str(detail["offerId"]),
            "offerKey": detail["offerKey"],
            "value": {"currencyCode": "EUR", "value": product["price"]},
            "installmentCustomizationEnabled": False,
            "disableConversion": False,
            "activeInstallments": detail.get("activeInstallments")
            or [True] + [False] * 11,
            "lotOffer": {},
            "recoveryWithSmartInstallments": False,
            "smartInstallmentTermsAgreed": False,
            "maxInstallmentsRecovery": None,
            "buyerInstallmentInterestRate": None,
        },
    }
    api_json(
        f"{PRODUCT_API_V1}product/{product_id}/offer/{detail['offerId']}",
        token,
        method="PUT",
        body=pricing_payload,
    )
    current_info = api_json(
        f"{PRODUCT_API_V1}product/{product_id}/basic-information", token
    )
    current_price = api_json(f"{PRODUCT_API_V1}product/{product_id}/pricing", token)
    if current_info["name"] != product["title"]:
        raise RuntimeError("Hotmart no actualizo el nombre del Metodo Keto")
    if abs(float(current_price["detail"]["value"]["value"]) - float(product["price"])) > 0.001:
        raise RuntimeError("Hotmart no actualizo el precio del Metodo Keto")
    log("LEGACY_OK metodo-keto title_and_price")


def command_manifest(token: str) -> None:
    catalog = load_catalog()
    remote = list_products(token)
    mapped = map_all_catalog_items(catalog, remote)
    items = [*catalog["products"], *catalog["bundles"]]
    if len(mapped) != len(items):
        missing = [item["slug"] for item in items if item["slug"] not in mapped]
        raise RuntimeError(f"Faltan productos para el manifiesto: {missing}")
    manifest: dict[str, Any] = {"products": {}}
    for index, item in enumerate(items, start=1):
        remote_item = mapped[item["slug"]]
        product_id = int(remote_item["productId"])
        pricing = api_json(f"{PRODUCT_API_V1}product/{product_id}/pricing", token)
        detail = pricing["detail"]
        links = api_json(
            f"{PRODUCT_API_V1}product/{product_id}/hotlink/{detail['offerId']}",
            token,
        )
        checkout = str(links.get("directPayment") or "")
        parsed = urllib.parse.urlparse(checkout)
        if parsed.scheme != "https" or parsed.hostname != "pay.hotmart.com":
            raise RuntimeError(f"Checkout Hotmart invalido para {item['slug']}")
        actual = float(detail["value"]["value"])
        if abs(actual - float(item["price"])) > 0.001:
            raise RuntimeError(
                f"Precio Hotmart distinto para {item['slug']}: {actual} != {item['price']}"
            )
        if remote_item["status"] != "ACTIVE":
            raise RuntimeError(f"Producto Hotmart inactivo: {item['slug']}")
        manifest["products"][item["slug"]] = {
            "productId": product_id,
            "ucode": remote_item["ucode"],
            "offerId": int(detail["offerId"]),
            "offerCode": detail["offerKey"],
            "price": actual,
            "currency": detail["value"]["currencyCode"],
            "checkoutUrl": checkout,
        }
        log(f"MANIFEST {index}/{len(items)} {item['slug']}")
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    log(f"MANIFEST_OK total={len(items)} path={MANIFEST_PATH}")


def bundle_products(
    bundle: dict[str, Any], catalog: dict[str, Any]
) -> list[dict[str, Any]]:
    products = list(catalog["products"])
    if bundle["includes"] == ["ALL"]:
        return products
    by_id = {product["id"]: product for product in products}
    try:
        return [by_id[item_id] for item_id in bundle["includes"]]
    except KeyError as error:
        raise RuntimeError(
            f"El pack {bundle['slug']} referencia un producto inexistente: {error}"
        ) from error


def build_bundle_archive(
    bundle: dict[str, Any], catalog: dict[str, Any]
) -> Path:
    BUNDLE_DIR.mkdir(parents=True, exist_ok=True)
    target = BUNDLE_DIR / f"{bundle['slug']}.zip"
    selected = bundle_products(bundle, catalog)
    for product in selected:
        source = PDF_DIR / f"{product['slug']}.pdf"
        if not source.is_file() or source.stat().st_size == 0:
            raise RuntimeError(f"Falta el PDF del pack: {source}")

    temporary = target.with_suffix(".part")
    with zipfile.ZipFile(
        temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6
    ) as archive:
        for product in selected:
            source = PDF_DIR / f"{product['slug']}.pdf"
            archive.write(source, arcname=f"{product['title']}.pdf")
    temporary.replace(target)
    return target


def command_bundles(page: Page, token: str, workers: int) -> None:
    """Crea, carga y aprueba los packs como productos descargables.

    Hotmart marca los ebooks como no elegibles para su tipo de producto Bundle.
    Un producto ebook con un unico ZIP conserva la entrega completa y permite
    gestionar precio, checkout y webhook de cada pack de forma independiente.
    """
    catalog = load_catalog()
    state = load_state()
    state.setdefault("bundles", {})
    remote = list_products(token)
    mapped = map_catalog_bundles(catalog, remote)
    state["bundles"].update(mapped)
    missing = [item for item in catalog["bundles"] if item["slug"] not in mapped]
    log(f"BUNDLE_CREATE encontrados={len(mapped)} faltantes={len(missing)}")
    if missing:
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(create_product, item, token): item for item in missing}
            for future in concurrent.futures.as_completed(futures):
                item = futures[future]
                result = future.result()
                state["bundles"][item["slug"]] = result
                save_state(state)
                log(f"BUNDLE_CREATED {item['slug']}")

    expected = len(catalog["bundles"])
    for _ in range(30):
        remote = list_products(token)
        mapped = map_catalog_bundles(catalog, remote)
        if len(mapped) == expected:
            break
        time.sleep(2)
    if len(mapped) != expected:
        missing_slugs = [
            item["slug"] for item in catalog["bundles"] if item["slug"] not in mapped
        ]
        raise RuntimeError(f"Hotmart aun no indexa los packs: {missing_slugs}")
    state["bundles"].update(mapped)
    save_state(state)

    assets = sanity_assets()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {}
        for product in catalog["products"]:
            asset = assets.get(product["slug"])
            if not asset:
                raise RuntimeError(f"Sanity no tiene PDF para {product['slug']}")
            futures[pool.submit(download_pdf, product, asset)] = product["slug"]
        for future in concurrent.futures.as_completed(futures):
            future.result()

    archives = {
        item["slug"]: build_bundle_archive(item, catalog)
        for item in catalog["bundles"]
    }
    log(f"BUNDLE_ZIP_OK total={len(archives)}")

    for index, bundle in enumerate(catalog["bundles"], start=1):
        item = mapped[bundle["slug"]]
        product_id = int(item["productId"])
        contents = list_content(product_id, token)
        if contents:
            log(
                f"BUNDLE_UPLOAD_SKIP {index}/{expected} "
                f"{bundle['slug']} files={len(contents)}"
            )
        else:
            bridge_file(page, archives[bundle["slug"]])
            result = upload_file_via_api(page, product_id)
            log(
                f"BUNDLE_UPLOADED {index}/{expected} {bundle['slug']} "
                f"id={result.get('id')} size={result.get('size')}"
            )

        if item["status"] == "ACTIVE":
            log(f"BUNDLE_APPROVE_SKIP {index}/{expected} {bundle['slug']} ACTIVE")
        else:
            if not list_content(product_id, token):
                raise RuntimeError(f"No se aprueba {bundle['slug']}: no tiene ZIP")
            api_json(
                f"{PRODUCT_API_V1}product/{product_id}/approval",
                token,
                method="POST",
                body={},
            )
            log(f"BUNDLE_APPROVED {index}/{expected} {bundle['slug']}")

    for _ in range(30):
        remote = list_products(token)
        mapped = map_catalog_bundles(catalog, remote)
        if all(item["status"] == "ACTIVE" for item in mapped.values()):
            break
        time.sleep(2)
    inactive = [slug for slug, item in mapped.items() if item["status"] != "ACTIVE"]
    if inactive:
        raise RuntimeError(f"Hotmart no activo aun estos packs: {inactive}")
    state["bundles"].update(mapped)
    save_state(state)
    log(f"BUNDLE_OK total={len(mapped)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "command",
        choices=(
            "create",
            "upload",
            "approve",
            "status",
            "bundles",
            "update-legacy",
            "gateway-only",
            "manifest",
            "all",
        ),
    )
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(CDP_URL)
        if not browser.contexts or not browser.contexts[0].pages:
            raise RuntimeError("No hay una pagina de Hotmart conectada")
        page = browser.contexts[0].pages[0]
        if "hotmart.com" not in page.url:
            raise RuntimeError(f"La pagina activa no es Hotmart: {page.url}")
        token = browser_token(page)
        if args.command in ("create", "all"):
            command_create(page, token, max(1, min(args.workers, 6)))
        if args.command in ("upload", "all"):
            command_upload(page, token)
        if args.command in ("approve", "all"):
            command_approve(token)
        if args.command in ("status", "all"):
            command_status(token)
        if args.command in ("bundles", "all"):
            command_bundles(page, token, max(1, min(args.workers, 6)))
        if args.command in ("update-legacy", "all"):
            command_update_legacy(token)
        if args.command in ("gateway-only", "all"):
            command_gateway_only(page, token)
        if args.command in ("manifest", "all"):
            command_manifest(token)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise
    except Exception as error:
        log(f"ERROR {type(error).__name__}: {error}")
        raise SystemExit(1)
