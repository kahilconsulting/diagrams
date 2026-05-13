/* Fit diagram to viewport */
function fitDiagram() {
  var d = document.querySelector('.diagram');
  var legend = document.querySelector('.legend-panel');
  var legendH = legend.offsetHeight + 32;
  d.style.transform = 'scale(1)';
  d.style.left = '0';
  d.style.top = '0';
  var dw = d.offsetWidth;
  var dh = d.offsetHeight;
  var availH = window.innerHeight - legendH;
  var scale = Math.min(window.innerWidth / dw, availH / dh);
  d.style.left = ((window.innerWidth - dw * scale) / 2) + 'px';
  d.style.top = ((availH - dh * scale) / 2) + 'px';
  d.style.transform = 'scale(' + scale + ')';
}
window.addEventListener('load', fitDiagram);
window.addEventListener('resize', fitDiagram);

/* Legend toggles */
document.querySelectorAll('.leg').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var el = document.querySelector('.' + this.dataset.target);
    var isActive = this.classList.toggle('active');
    if (isActive) { el.classList.remove('dimmed'); }
    else { el.classList.add('dimmed'); }
  });
});
document.getElementById('allBtn').addEventListener('click', function() {
  var legs = document.querySelectorAll('.leg:not(#allBtn)');
  var allActive = Array.from(legs).every(function(b) { return b.classList.contains('active'); });
  var turnOn = !allActive;
  legs.forEach(function(btn) {
    var el = document.querySelector('.' + btn.dataset.target);
    if (turnOn) { btn.classList.add('active'); el.classList.remove('dimmed'); }
    else { btn.classList.remove('active'); el.classList.add('dimmed'); }
  });
  this.classList.toggle('active', turnOn);
});

/* Wire up data-popup for class-mapped elements (each diagram defines classMap) */
if (typeof classMap !== 'undefined') {
  Object.keys(classMap).forEach(function(cls) {
    var el = document.querySelector('.' + cls);
    if (el) el.setAttribute('data-popup', classMap[cls]);
  });
}

/* Lightbox */
var lightbox = document.createElement('div');
lightbox.id = 'imgLightbox';
lightbox.innerHTML = '<img id="imgLightboxImg"><button id="imgLightboxClose">&#x2715;</button>';
document.body.appendChild(lightbox);
var lbImg = document.getElementById('imgLightboxImg');
function openLightbox(src, alt) {
  lbImg.src = src;
  lbImg.alt = alt;
  lightbox.classList.add('open');
}
function closeLightbox() { lightbox.classList.remove('open'); }
document.getElementById('imgLightboxClose').addEventListener('click', function(e) { e.stopPropagation(); closeLightbox(); });
lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLightbox(); });

/* Popup open/close */
var overlay = document.getElementById('popupOverlay');
function buildList(id, items, accent) {
  var list = document.getElementById(id);
  list.innerHTML = '';
  items.forEach(function(p) {
    var li = document.createElement('li');
    var dot = document.createElement('span');
    dot.className = 'popup-dot';
    dot.style.background = accent;
    li.appendChild(dot);
    li.appendChild(document.createTextNode(p));
    list.appendChild(li);
  });
}
function openPopup(key) {
  var d = popupData[key];
  if (!d) return;
  document.getElementById('popupAccent').style.background = d.accent;
  document.getElementById('popupTitle').textContent = d.title;
  document.getElementById('popupSubtitle').textContent = d.subtitle;

  var body = document.querySelector('.popup-body');
  var hasPoints = d.points && d.points.length;
  if (hasPoints) {
    buildList('popupList', d.points, d.accent);
    buildList('popupScenarios', d.scenarios || [], d.accent);
    body.style.display = '';
  } else {
    body.style.display = 'none';
  }

  var shots = document.getElementById('popupScreenshots');
  shots.innerHTML = '';
  shots.style.marginTop = hasPoints ? 'clamp(14px,1.6vw,28px)' : '0';
  if (d.screenshots && d.screenshots.length) {
    d.screenshots.forEach(function(s) {
      var item = document.createElement('div');
      item.className = 'popup-screenshot-item';
      var cap = document.createElement('p');
      cap.className = 'popup-screenshot-caption';
      cap.textContent = s.desc;
      item.appendChild(cap);
      if (s.src) {
        var img = document.createElement('img');
        img.src = s.src;
        img.alt = s.desc;
        img.className = 'popup-screenshot-clickable';
        img.addEventListener('click', function() { openLightbox(this.src, this.alt); });
        item.appendChild(img);
      } else {
        var ph = document.createElement('div');
        ph.className = 'popup-screenshot-ph';
        ph.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span class="popup-screenshot-label">Screenshot coming soon</span>';
        item.appendChild(ph);
      }
      shots.appendChild(item);
    });
    shots.style.display = '';
  } else {
    shots.style.display = 'none';
  }

  overlay.classList.add('open');
}
function closePopup() { overlay.classList.remove('open'); }

document.getElementById('popupClose').addEventListener('click', closePopup);
overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopup(); });

document.querySelectorAll('[data-popup]').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.stopPropagation();
    openPopup(this.dataset.popup);
  });
});
