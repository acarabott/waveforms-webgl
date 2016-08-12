function slider(min=0.0, max=1.0, value=0.5, step=0.01, vert=true, action) {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.style['-webkit-appearance'] = vert ? 'slider-vertical' : '';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  slider.step = step;
  slider.addEventListener('input', action);
  return slider;
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