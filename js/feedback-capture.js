/* Adapted from Sportsagent: self-contained capture of the visible game and UI. */
(function () {
/** Capture this game's DOM without a screen-sharing prompt or network dependency. */
async function captureScreen() {
  const width = innerWidth;
  const height = innerHeight;
  const offsetX = scrollX;
  const offsetY = scrollY;
  const clone = document.body.cloneNode(true);
  const sources = [document.body, ...document.body.querySelectorAll('*')];
  const targets = [clone, ...clone.querySelectorAll('*')];
  const images = [];
  const pseudoRules = [];
  const localReferences = (value) =>
    value.replace(/url\(["\']?[^)"\']*#([^ )"\']+)["\']?\)/g, 'url(#$1)');
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const target = targets[i];
    if (source.closest('[data-feedback-ui], #toast')) continue;
    const computed = getComputedStyle(source);
    // Inline resolved styles so the image needs no external stylesheets.
    for (const property of computed)
      target.style.setProperty(property, localReferences(computed.getPropertyValue(property)));
    for (const pseudo of ['::before', '::after']) {
      const style = getComputedStyle(source, pseudo);
      if (!['none', 'normal'].includes(style.content)) {
        const className = `capture-pseudo-${i}`;
        target.classList.add(className);
        const declarations = [...style]
          .map((property) => `${property}:${localReferences(style.getPropertyValue(property))}`)
          .join(';');
        pseudoRules.push(`.${className}${pseudo}{${declarations}}`);
      }
    }
    target.style.animation = 'none';
    target.style.transition = 'none';
    if (computed.position === 'fixed') {
      const rect = source.getBoundingClientRect();
      Object.assign(target.style, {
        position: 'absolute',
        left: `${rect.left + offsetX}px`,
        top: `${rect.top + offsetY}px`,
        right: 'auto',
        bottom: 'auto',
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    }
    if (source instanceof HTMLInputElement) target.setAttribute('value', source.value);
    if (source instanceof HTMLTextAreaElement) target.textContent = source.value;
    if (source instanceof HTMLSelectElement) {
      for (let j = 0; j < target.options.length; j++) {
        target.options[j].toggleAttribute('selected', source.options[j].selected);
      }
    }
    if (source instanceof HTMLImageElement && source.currentSrc) {
      images.push(
        fetch(source.currentSrc, { signal: AbortSignal.timeout(8000) })
          .then((response) => {
            if (!response.ok) throw Error('Could not capture a game image.');
            return response.blob();
          })
          .then(
            (blob) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  target.src = reader.result;
                  target.removeAttribute('srcset');
                  resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              }),
          ),
      );
    }
    if (source instanceof HTMLCanvasElement && source.width && source.height) {
      const image = document.createElement('img');
      image.src = source.toDataURL('image/png');
      image.setAttribute('style', target.getAttribute('style') || '');
      image.alt = source.getAttribute('aria-label') || 'Current lawn and equipment';
      target.replaceWith(image);
    }
    // Preserve independently scrolled modal/list contents in the serialized image.
    if (source.scrollTop || source.scrollLeft) {
      if (source !== document.body && source !== document.documentElement) {
        const contents = document.createElement('div');
        contents.style.transform = `translate(${-source.scrollLeft}px, ${-source.scrollTop}px)`;
        contents.append(...target.childNodes);
        target.append(contents);
      }
    }
  }
  clone.querySelectorAll('script, [data-feedback-ui], #toast').forEach((node) => node.remove());
  Object.assign(clone.style, {
    position: 'relative',
    margin: '0',
    width: `${width}px`,
    transform: `translate(${-offsetX}px, ${-offsetY}px)`,
  });
  await Promise.all(images);
  const pseudoStyle = document.createElement('style');
  pseudoStyle.textContent = pseudoRules.join('\n');
  clone.prepend(pseudoStyle);
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="${width}" height="${Math.max(document.documentElement.scrollHeight, height)}">${serialized}</foreignObject></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  context.scale(scale, scale);
  context.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

  globalThis.MOW = globalThis.MOW || {};
  globalThis.MOW.captureFeedbackScreen = captureScreen;
})();
