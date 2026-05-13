import re, os

def audit_file(path, label):
    print(f"\n=== {label} ===")
    if not os.path.exists(path):
        print("FILE NOT FOUND")
        return
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()
    
    m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = m.group(1).strip() if m else "NOT FOUND"
    print(f"Title ({len(title)} chars): {title[:200]}")
    
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']description["\']', html, re.IGNORECASE)
    desc = m.group(1).strip() if m else "NOT FOUND"
    print(f"Meta description ({len(desc)} chars): {desc[:300]}")
    
    m = re.search(r'<meta[^>]+name=["\']viewport["\'][^>]+content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']viewport["\']', html, re.IGNORECASE)
    viewport = m.group(1).strip() if m else "NOT FOUND"
    print(f"Viewport: {viewport}")
    
    m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']robots["\']', html, re.IGNORECASE)
    robots = m.group(1).strip() if m else "NOT FOUND"
    print(f"Robots meta: {robots}")
    
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']*)["\'][^>]+rel=["\']canonical["\']', html, re.IGNORECASE)
    canonical = m.group(1).strip() if m else "NOT FOUND"
    print(f"Canonical: {canonical}")
    
    ogs = re.findall(r'<meta[^>]+property=["\']og:([^"\']*)["\'][^>]+content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if ogs:
        print("Open Graph:")
        for prop, cont in ogs[:20]:
            print(f"  og:{prop} = {cont[:200]}")
    else:
        print("Open Graph: NOT FOUND")
    
    tws = re.findall(r'<meta[^>]+name=["\']twitter:([^"\']*)["\'][^>]+content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if tws:
        print("Twitter Card:")
        for prop, cont in tws[:20]:
            print(f"  twitter:{prop} = {cont[:200]}")
    else:
        print("Twitter Card: NOT FOUND")
    
    for level in range(1, 7):
        tags = re.findall(rf'<h{level}[^>]*>(.*?)</h{level}>', html, re.IGNORECASE | re.DOTALL)
        if tags:
            print(f"H{level} ({len(tags)}):")
            for tag in tags[:5]:
                txt = re.sub(r"<[^>]+>", "", tag).strip()
                print(f"  - {txt[:200]}")
            if len(tags) > 5:
                print(f"  ... и ещё {len(tags)-5}")
    
    imgs = re.findall(r"<img[^>]*>", html, re.IGNORECASE)
    print(f"Images total: {len(imgs)}")
    print("First 10 img alt:")
    for i, img in enumerate(imgs[:10]):
        alt = re.search(r'alt=["\']([^"\']*)["\']', img, re.IGNORECASE)
        src = re.search(r'src=["\']([^"\']*)["\']', img, re.IGNORECASE)
        loading = re.search(r'loading=["\']([^"\']*)["\']', img, re.IGNORECASE)
        alt_v = alt.group(1) if alt else "[нет alt]"
        src_v = src.group(1)[:100] if src else "[нет src]"
        lazy = loading.group(1) if loading else "-"
        print(f"  {i+1}. alt=\"{alt_v}\" loading={lazy} src={src_v}")
    
    lds = re.findall(r'<script[^>]*type=["\']application/ld\\+json["\'][^>]*>(.*?)</script>', html, re.IGNORECASE | re.DOTALL)
    if lds:
        print(f"JSON-LD blocks: {len(lds)}")
        for ld in lds[:2]:
            print(f"  {ld[:500]}...")
    else:
        print("JSON-LD: NOT FOUND")
    
    sems = ["header", "nav", "main", "article", "section", "footer"]
    for tag in sems:
        count = len(re.findall(rf'<{tag}[\s>]', html, re.IGNORECASE))
        print(f"Semantic <{tag}>: {count}")
    
    css = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']*)["\']', html, re.IGNORECASE)
    print(f"External CSS: {len(css)}")
    for c in css[:5]:
        print(f"  {c}")
    
    js = re.findall(r'<script[^>]+src=["\']([^"\']*)["\']', html, re.IGNORECASE)
    print(f"External JS: {len(js)}")
    for j in js[:5]:
        print(f"  {j}")
    
    exts = {}
    for img in imgs:
        src = re.search(r'src=["\']([^"\']*)["\']', img, re.IGNORECASE)
        if src:
            url = src.group(1)
            ext = url.split(".")[-1].split("?")[0].lower() if "." in url else "none"
            exts[ext] = exts.get(ext, 0) + 1
    print("Image formats:")
    for ext, count in sorted(exts.items(), key=lambda x: -x[1]):
        print(f"  .{ext}: {count}")

audit_file("audit_home.html", "HOME")
audit_file("audit_about.html", "ABOUT")
audit_file("audit_catalog.html", "CATALOG")
audit_file("audit_services.html", "SERVICES")
