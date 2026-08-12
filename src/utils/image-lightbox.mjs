const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export const calculateImageFitWidth = ({ baseWidth, baseHeight, availableWidth, availableHeight }) => {
  if (baseWidth <= 0 || baseHeight <= 0 || availableWidth <= 0 || availableHeight <= 0) return null;
  const fitScale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight, 1);
  return Math.max(1, Math.floor(baseWidth * fitScale));
};

export const calculatePreservedScroll = ({
  scrollLeft,
  scrollTop,
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
  nextScrollWidth,
  nextScrollHeight,
}) => {
  const focusX = scrollWidth > 0 ? clamp((scrollLeft + clientWidth / 2) / scrollWidth, 0, 1) : 0.5;
  const focusY = scrollHeight > 0 ? clamp((scrollTop + clientHeight / 2) / scrollHeight, 0, 1) : 0.5;
  const maxLeft = Math.max(0, nextScrollWidth - clientWidth);
  const maxTop = Math.max(0, nextScrollHeight - clientHeight);

  return {
    left: clamp(focusX * nextScrollWidth - clientWidth / 2, 0, maxLeft),
    top: clamp(focusY * nextScrollHeight - clientHeight / 2, 0, maxTop),
  };
};

export const initializeImageLightbox = () => {
  const lightbox = document.querySelector('[data-image-lightbox]');
  const expandedImage = lightbox?.querySelector('[data-lightbox-image]');
  const caption = lightbox?.querySelector('[data-lightbox-caption]');
  const viewport = lightbox?.querySelector('[data-lightbox-viewport]');
  const canvas = lightbox?.querySelector('.image-lightbox__canvas');
  const sizeToggle = lightbox?.querySelector('[data-lightbox-size-toggle]');
  const sizeIcon = lightbox?.querySelector('[data-lightbox-size-icon]');
  const closeButton = lightbox?.querySelector('[data-lightbox-close]');
  if (!lightbox || !expandedImage || !caption || !viewport || !canvas || !sizeToggle || !sizeIcon || !closeButton) return;
  if (lightbox.dataset.lightboxReady === 'true') return;

  lightbox.dataset.lightboxReady = 'true';
  let triggerImage = null;
  let baseWidth = 0;
  let baseHeight = 0;

  const viewportSnapshot = () => ({
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    clientWidth: viewport.clientWidth,
    clientHeight: viewport.clientHeight,
    scrollWidth: viewport.scrollWidth,
    scrollHeight: viewport.scrollHeight,
  });

  const fitImageToViewport = () => {
    const canvasStyle = window.getComputedStyle(canvas);
    const horizontalPadding = (Number.parseFloat(canvasStyle.paddingLeft) || 0) + (Number.parseFloat(canvasStyle.paddingRight) || 0);
    const verticalPadding = (Number.parseFloat(canvasStyle.paddingTop) || 0) + (Number.parseFloat(canvasStyle.paddingBottom) || 0);
    const fitWidth = calculateImageFitWidth({
      baseWidth,
      baseHeight,
      availableWidth: Math.max(1, viewport.clientWidth - horizontalPadding),
      availableHeight: Math.max(1, viewport.clientHeight - verticalPadding),
    });

    if (fitWidth === null) {
      expandedImage.style.removeProperty('width');
      return;
    }
    expandedImage.style.width = `${fitWidth}px`;
  };

  const updateZoom = () => {
    const isFit = lightbox.dataset.lightboxFit === 'true';
    if (isFit) {
      fitImageToViewport();
    } else if (baseWidth > 0) {
      expandedImage.style.width = `${baseWidth}px`;
    }
    sizeToggle.setAttribute('aria-label', isFit ? '원본 크기로 보기' : '화면에 맞추기');
    sizeIcon.textContent = isFit ? '+' : '−';
  };

  const updateZoomPreservingFocus = (previousViewport) => {
    updateZoom();
    const target = calculatePreservedScroll({
      ...previousViewport,
      nextScrollWidth: viewport.scrollWidth,
      nextScrollHeight: viewport.scrollHeight,
    });
    viewport.scrollTo({ ...target, behavior: 'auto' });
  };

  const openImage = (image) => {
    const source = image.currentSrc || image.src;
    if (!source) return;

    triggerImage = image;
    baseWidth = image.naturalWidth || image.width;
    baseHeight = image.naturalHeight || image.height;
    expandedImage.src = source;
    expandedImage.alt = image.alt || '확대 이미지';
    caption.textContent = image.alt || '이미지 확대 보기';
    lightbox.dataset.lightboxFit = 'true';
    document.documentElement.classList.add('image-lightbox-open');
    lightbox.showModal();
    updateZoom();
    viewport.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    sizeToggle.focus();
  };

  document.querySelectorAll('.post-article img').forEach((image) => {
    if (image.dataset.lightboxReady === 'true' || image.closest('a') || image.hasAttribute('data-no-lightbox')) return;

    image.dataset.lightboxReady = 'true';
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.setAttribute('aria-controls', 'image-lightbox');
    image.setAttribute('aria-label', `${image.alt || '본문 이미지'} 이미지 크게 보기`);
    image.addEventListener('click', () => openImage(image));
    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openImage(image);
    });
  });

  expandedImage.addEventListener('load', () => {
    baseWidth = expandedImage.naturalWidth || baseWidth;
    baseHeight = expandedImage.naturalHeight || baseHeight;
    updateZoom();
  });

  sizeToggle.addEventListener('click', () => {
    const previousViewport = viewportSnapshot();
    const isFit = lightbox.dataset.lightboxFit === 'true';
    lightbox.dataset.lightboxFit = String(!isFit);
    updateZoomPreservingFocus(previousViewport);
  });
  window.addEventListener('resize', () => {
    if (lightbox.open && lightbox.dataset.lightboxFit === 'true') updateZoom();
  }, { passive: true });

  closeButton.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('image-lightbox-open');
    expandedImage.removeAttribute('src');
    expandedImage.style.removeProperty('width');
    triggerImage?.focus();
    triggerImage = null;
  });
};
