/*
 * THROWAWAY UI PROTOTYPE
 * Three radically different photo-journal variants on one route,
 * switchable through ?variant=A|B|C and the floating bottom bar.
 */

const photos = [
  { id: "p01", title: "风从桥上来", album: "城市散步", ratio: "3 / 4", src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=86", camera: "FUJIFILM X-T5", lens: "XF 33mm F1.4", setting: "ƒ/2 · 1/500s · ISO 320", date: "2026.10.18", note: "过桥时天刚暗下来，灯光比行人更早抵达街角。", views: 428 },
  { id: "p02", title: "山路尽头", album: "旅途", ratio: "4 / 3", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=86", camera: "SONY α7 IV", lens: "FE 35mm F1.4 GM", setting: "ƒ/4 · 1/800s · ISO 100", date: "2026.10.12", note: "没有继续赶路，停在风把草压低的地方。", views: 305 },
  { id: "p03", title: "潮汐以前", album: "自然", ratio: "2 / 3", src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=86", camera: "Nikon Zf", lens: "NIKKOR Z 40mm F2", setting: "ƒ/2.8 · 1/320s · ISO 200", date: "2026.10.02", note: "海面还没有决定要靠近还是离开。", views: 661 },
  { id: "p04", title: "树林里没有时钟", album: "自然", ratio: "4 / 5", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1100&q=86", camera: "Canon EOS R6 II", lens: "RF 50mm F1.8", setting: "ƒ/2.8 · 1/160s · ISO 640", date: "2026.09.27", note: "树叶把每一分钟拆得很碎。", views: 523 },
  { id: "p05", title: "傍晚以前", album: "日常碎片", ratio: "3 / 2", src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1400&q=86", camera: "FUJIFILM X100VI", lens: "23mm F2", setting: "ƒ/5.6 · 1/1000s · ISO 125", date: "2026.09.20", note: "天空在最后几分钟里忽然变得慷慨。", views: 812 },
  { id: "p06", title: "窗边", album: "人物", ratio: "4 / 5", src: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=1100&q=86", camera: "Leica Q3", lens: "Summilux 28mm F1.7", setting: "ƒ/1.7 · 1/250s · ISO 400", date: "2026.09.11", note: "她没有看镜头，光替我完成了介绍。", views: 934 },
  { id: "p07", title: "雨停之后", album: "城市散步", ratio: "3 / 4", src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1100&q=86", camera: "Ricoh GR IIIx", lens: "26.1mm F2.8", setting: "ƒ/4 · 1/125s · ISO 800", date: "2026.08.30", note: "玻璃和地面都在重复这座城市。", views: 246 },
  { id: "p08", title: "白色房间", album: "日常碎片", ratio: "4 / 3", src: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1300&q=86", camera: "iPhone 17 Pro", lens: "Main Camera 24mm", setting: "ƒ/1.8 · 1/120s · ISO 80", date: "2026.08.22", note: "下午四点，桌面上只剩一杯水和移动的影子。", views: 188 },
  { id: "p09", title: "无人站台", album: "旅途", ratio: "16 / 10", src: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=86", camera: "SONY α7C II", lens: "FE 24-70mm F2.8", setting: "ƒ/3.5 · 1/500s · ISO 250", date: "2026.08.09", note: "车已经走了，风还停在黄色的线后面。", views: 367 },
  { id: "p10", title: "经过湖面", album: "自然", ratio: "3 / 4", src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1100&q=86", camera: "Nikon Z8", lens: "Z 24-120mm F4 S", setting: "ƒ/5.6 · 1/400s · ISO 100", date: "2026.07.29", note: "远处的房子像一句没有说完的话。", views: 745 },
  { id: "p11", title: "微光剧场", album: "人物", ratio: "2 / 3", src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=86", camera: "Canon EOS R5", lens: "RF 85mm F1.2", setting: "ƒ/1.8 · 1/200s · ISO 500", date: "2026.07.18", note: "幕布没有升起，他只是站在窗边。", views: 1072 },
  { id: "p12", title: "慢一些", album: "日常碎片", ratio: "4 / 3", src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1300&q=86", camera: "FUJIFILM X-Pro3", lens: "XF 23mm F2", setting: "ƒ/2.8 · 1/125s · ISO 640", date: "2026.07.03", note: "没有必须立刻完成的事，咖啡也可以等一等。", views: 219 }
];

const variants = {
  A: { name: "纵向索引" },
  B: { name: "时间章节" },
  C: { name: "接触印样" }
};

const state = {
  variant: new URLSearchParams(location.search).get("variant")?.toUpperCase() || "A",
  view: location.hash === "#gallery" ? "gallery" : "home",
  filter: "全部",
  selected: null,
  seenThisSession: new Set()
};
if (!variants[state.variant]) state.variant = "A";

const app = document.querySelector("#app");
const lightboxRoot = document.querySelector("#lightbox-root");
const switcher = document.querySelector("#prototype-switcher");
const statePanel = document.querySelector("#prototype-state");

function nav() {
  return `<header class="topbar">
    <button class="brand" data-route="home">PHOTO / NOTES</button>
    <nav class="topnav" aria-label="主导航">
      <button data-route="home" ${state.view === "home" ? 'aria-current="page"' : ""}>主页</button>
      <button data-route="gallery" ${state.view === "gallery" ? 'aria-current="page"' : ""}>摄影集</button>
      <button type="button">关于</button>
    </nav>
  </header>`;
}

function jump(label = "进入摄影集") {
  return `<button class="route-link" data-route="gallery"><span class="rule"></span>${label}</button>`;
}

function filterButtons(wrapperClass = "") {
  const albums = ["全部", "人物", "城市散步", "旅途", "自然", "日常碎片"];
  return `<div class="${wrapperClass}">${albums.map(a => `<button class="filter-button ${state.filter === a ? "active" : ""}" data-filter="${a}">${a}</button>`).join("")}</div>`;
}

function galleryCards() {
  const visible = state.filter === "全部" ? photos : photos.filter(p => p.album === state.filter);
  return `<div class="masonry">${visible.map(p => `
    <button class="photo-card" data-photo="${p.id}" style="aspect-ratio:${p.ratio}" aria-label="查看${p.title}的详情">
      <img src="${p.src}" alt="${p.title}" loading="lazy" style="aspect-ratio:${p.ratio};object-fit:cover" />
      <span class="photo-overlay"><strong>${p.title}</strong><span>眼 ${p.views + (state.seenThisSession.has(p.id) ? 1 : 0)}</span></span>
    </button>`).join("")}</div>`;
}

function variantA() {
  if (state.view === "gallery") return `<div class="shell variant-a">${nav()}<section class="a-gallery">
    <aside class="a-index"><h1>摄影集</h1>${filterButtons("album-list")}</aside>
    <div class="gallery-column">${galleryCards()}</div>
  </section></div>`;
  return `<div class="shell variant-a">${nav()}<section class="home">
    <div class="hero-a">
      <div class="a-vertical"><strong>影像日记</strong><span>PHOTO NOTES</span></div>
      <div class="a-portrait"><img src="${photos[5].src}" alt="窗边的人像" /></div>
      <div class="hero-copy a-title">记录生活<br>留下的微光</div>
      <div class="a-sidecopy">私人影像档案<br>杭州与更远的地方<br><br>不定期更新</div>
    </div>
    <div class="a-jump"><div><p>摄影捕捉真实生活，也把那些来不及说完的情绪，留在光里。</p>${jump("沿着照片继续")}</div></div>
  </section></div>`;
}

function variantB() {
  if (state.view === "gallery") return `<div class="shell variant-b">${nav()}<section class="b-gallery">
    <div class="b-gallery-head"><h1>时间里的照片</h1>${filterButtons("b-filters")}</div>
    ${galleryCards()}
  </section></div>`;
  return `<div class="shell variant-b">${nav()}<section class="home">
    <div class="hero-b">
      <div class="b-image"><img src="${photos[1].src}" alt="山野风景" /></div>
      <div class="b-copy"><div class="hero-copy"><time>二〇二六年十月</time><h1>山路尽头，<br>风先到了。</h1><p>没有继续赶路。我们停下来，看云越过山脊，也看时间暂时失去方向。</p></div><small>最近一次记录 / 杭州以西</small></div>
    </div>
    <div class="b-ledger"><article><time>九月二十七日</time><h2>树林里没有时钟</h2><img class="small-image" src="${photos[3].src}" alt="树林" /></article><article><time>九月二十日</time><h2>傍晚以前</h2><img class="small-image" src="${photos[4].src}" alt="晚霞" /></article></div>
    <div class="b-jump"><blockquote>所有照片最终都会成为日期，而日期会把我们带回当时。</blockquote>${jump("打开时间里的摄影集")}</div>
  </section></div>`;
}

function variantC() {
  if (state.view === "gallery") return `<div class="shell variant-c">${nav()}<section class="c-gallery">
    ${filterButtons("c-filterbar")}${galleryCards()}
  </section></div>`;
  return `<div class="shell variant-c">${nav()}<section class="home">
    <div class="hero-c">
      <div class="c-manifesto hero-copy"><h1>照片<br>不是<br>证明</h1><p>它们只是一些被光照亮过的片刻。没有完整故事，也不急着给出解释。</p></div>
      <div class="c-hero-grid"><img src="${photos[6].src}" alt="建筑与天空" /><img src="${photos[5].src}" alt="窗边人物" /><img src="${photos[4].src}" alt="晚霞" /></div>
    </div>
    <div class="c-jump"><div class="frame-no">36</div><div><h2>一卷结束之后，<br>从接触印样重新开始。</h2>${jump("查看全部底片")}</div></div>
  </section></div>`;
}

function render() {
  app.innerHTML = state.variant === "A" ? variantA() : state.variant === "B" ? variantB() : variantC();
  bindPageEvents();
  renderSwitcher();
  renderState();
  document.documentElement.dataset.variant = state.variant;
}

function bindPageEvents() {
  app.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => {
    state.view = el.dataset.route;
    location.hash = state.view === "gallery" ? "gallery" : "";
    state.selected = null;
    window.scrollTo(0, 0);
    render();
  }));
  app.querySelectorAll("[data-filter]").forEach(el => el.addEventListener("click", () => {
    state.filter = el.dataset.filter;
    render();
  }));
  app.querySelectorAll("[data-photo]").forEach(el => el.addEventListener("click", () => openPhoto(el.dataset.photo)));
}

function openPhoto(id) {
  const photo = photos.find(p => p.id === id);
  if (!photo) return;
  state.selected = id;
  state.seenThisSession.add(id);
  lightboxRoot.innerHTML = `<div class="lightbox" role="dialog" aria-modal="true" aria-labelledby="photo-title">
    <div class="lightbox-media"><img src="${photo.src}" alt="${photo.title}" /></div>
    <aside class="lightbox-info"><button class="lightbox-close" aria-label="关闭照片详情">×</button><h2 id="photo-title">${photo.title}</h2><p class="note">${photo.note}</p>
      <dl class="exif"><div><dt>相机</dt><dd>${photo.camera}</dd></div><div><dt>镜头</dt><dd>${photo.lens}</dd></div><div><dt>参数</dt><dd>${photo.setting}</dd></div><div><dt>日期</dt><dd>${photo.date}</dd></div><div><dt>分类</dt><dd>${photo.album}</dd></div><div><dt>位置</dt><dd>仅展示城市级信息</dd></div></dl>
      <p class="views">眼 ${photo.views + 1} 次查看 · 本次会话已去重</p>
    </aside></div>`;
  lightboxRoot.querySelector(".lightbox-close").focus();
  lightboxRoot.querySelector(".lightbox-close").addEventListener("click", closePhoto);
  lightboxRoot.querySelector(".lightbox").addEventListener("click", e => { if (e.target.classList.contains("lightbox")) closePhoto(); });
  renderState();
}

function closePhoto() {
  state.selected = null;
  lightboxRoot.innerHTML = "";
  render();
}

function cycleVariant(direction) {
  const keys = Object.keys(variants);
  const next = (keys.indexOf(state.variant) + direction + keys.length) % keys.length;
  state.variant = keys[next];
  const url = new URL(location.href);
  url.searchParams.set("variant", state.variant);
  history.replaceState({}, "", url);
  closePhoto();
}

function renderSwitcher() {
  switcher.innerHTML = `<button data-cycle="-1" aria-label="上一个方案">←</button><span>原型 ${state.variant} · ${variants[state.variant].name}</span><button data-cycle="1" aria-label="下一个方案">→</button>`;
  switcher.querySelectorAll("[data-cycle]").forEach(el => el.addEventListener("click", () => cycleVariant(Number(el.dataset.cycle))));
}

function renderState() {
  statePanel.textContent = `THROWAWAY PROTOTYPE\nvariant: ${state.variant} (${variants[state.variant].name})\nview: ${state.view}\nfilter: ${state.filter}\nselected: ${state.selected || "none"}\nsession views: ${state.seenThisSession.size}`;
}

window.addEventListener("keydown", event => {
  const tag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA"].includes(tag) || document.activeElement?.isContentEditable) return;
  if (event.key === "Escape" && state.selected) closePhoto();
  if (!state.selected && event.key === "ArrowLeft") cycleVariant(-1);
  if (!state.selected && event.key === "ArrowRight") cycleVariant(1);
});

window.addEventListener("hashchange", () => {
  state.view = location.hash === "#gallery" ? "gallery" : "home";
  render();
});

render();

