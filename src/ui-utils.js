const controlsContainer = document.createElement('div');
controlsContainer.id = 'controls';

function addControl(control) {
  const wrap = document.createElement('div');
  if (Array.isArray(control)) {
    control.forEach(c => wrap.appendChild(c));
  } else {
    wrap.appendChild(control);
  }
  controlsContainer.appendChild(wrap);
}

function makeSlider(_label, min=0.0, max=1.0, value=0.5, step=0.01, vert=true,
    action) {
  const name = `slider-${makeElementName(_label)}`;

  const label = document.createElement('label')
  label.htmlFor = name;
  label.textContent = _label;

  const valueText = document.createElement('span');
  valueText.textContent = value;

  const slider = document.createElement('input');
  slider.name = name
  slider.type = 'range';
  slider.style['-webkit-appearance'] = vert ? 'slider-vertical' : '';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.step = step;
  slider.addEventListener('input', event => {
    valueText.textContent = event.target.valueAsNumber;
    action(event);
  });

  addControl([label, slider, valueText]);
}

function makeElementName (string) {
  return string.replace(/[^a-z0-9\-\_]/g, s => {
    const char = s.charCodeAt(0);
    if (char === 32) { return '-'; }
    if (c >= 65 && c <= 90) { return '_' + s.toLowerCase(); }
    return '__' + ('000' + c.toString(16)).slice(-4);
  })
}

function mouseAction(target, type, action) {
  target.addEventListener(type, event => {
    const rect = event.target.getBoundingClientRect();
    const targetHalfW = target.width / 2;
    const targetHalfH = target.height / 2;
    const absX = event.clientX - rect.left;
    const absY = event.clientY - rect.top;
    const x = absX / target.width;
    const y = absY / target.height;
    const glX = (absX - targetHalfW) / targetHalfW;
    const glY = (targetHalfH - absY) / targetHalfH;
    action(x, y, glX, glY, event);
  });
}