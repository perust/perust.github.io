export const DEFAULT_IMAGE_ZOOM = 1.25;
export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 3;
export const IMAGE_ZOOM_STEP = 0.25;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export const nextImageZoom = ({ zoom, delta, isFit }) => {
  if (isFit && delta < 0) return { zoom, exitFit: false };
  if (isFit) return { zoom: MIN_IMAGE_ZOOM, exitFit: true };
  return {
    zoom: clamp(zoom + delta, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM),
    exitFit: true,
  };
};

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
  const zoomOutButton = lightbox?.querySelector('[data-lightbox-zoom-out]');
  const zoomStatus = lightbox?.querySelector('[data-lightbox-zoom-status]');
  const zoomInButton = lightbox?.querySelector('[data-lightbox-zoom-in]');
  const fitButton = lightbox?.querySelector('[data-lightbox-fit]');
  const originalLink = lightbox?.querySelector('[data-lightbox-original]');
  const closeButton = lightbox?.querySelector('[data-lightbox-close]');
  if (!lightbox || !expandedImage || !caption || !viewport || !canvas || !zoomOutButton || !zoomStatus || !zoomInButton || !fitButton || !originalLink || !closeButton) return;
  if (lightbox.dataset.lightboxReady === 'true') return;

  lightbox.dataset.lightboxReady = 'true';
  let triggerImage = null;
  let baseWidth = 0;
  let baseHeight = 0;
  let zoom = DEFAULT_IMAGE_ZOOM;

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
      expandedImage.style.width = `${Math.round(baseWidth * zoom)}px`;
    }
    zoomStatus.textContent = isFit ? '맞춤' : `${Math.round(zoom * 100)}%`;
    zoomOutButton.disabled = isFit || zoom <= MIN_IMAGE_ZOOM;
    zoomInButton.disabled = !isFit && zoom >= MAX_IMAGE_ZOOM;
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
    zoom = DEFAULT_IMAGE_ZOOM;
    expandedImage.src = source;
    expandedImage.alt = image.alt || '확대 이미지';
    caption.textContent = image.alt || '이미지 원본 보기';
    originalLink.href = source;
    lightbox.dataset.lightboxFit = 'false';
    fitButton.textContent = '화면에 맞추기';
    fitButton.setAttribute('aria-pressed', 'false');
    updateZoom();
    viewport.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.classList.add('image-lightbox-open');
    lightbox.showModal();
    closeButton.focus();
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

  const changeZoom = (delta) => {
    const isFit = lightbox.dataset.lightboxFit === 'true';
    const next = nextImageZoom({ zoom, delta, isFit });
    if (!next.exitFit) return;

    const previousViewport = viewportSnapshot();
    zoom = next.zoom;
    lightbox.dataset.lightboxFit = 'false';
    fitButton.textContent = '화면에 맞추기';
    fitButton.setAttribute('aria-pressed', 'false');
    updateZoomPreservingFocus(previousViewport);
  };

  zoomOutButton.addEventListener('click', () => changeZoom(-IMAGE_ZOOM_STEP));
  zoomInButton.addEventListener('click', () => changeZoom(IMAGE_ZOOM_STEP));
  window.addEventListener('resize', () => {
    if (lightbox.open && lightbox.dataset.lightboxFit === 'true') updateZoom();
  }, { passive: true });

  fitButton.addEventListener('click', () => {
    const previousViewport = viewportSnapshot();
    const isFit = lightbox.dataset.lightboxFit !== 'true';
    lightbox.dataset.lightboxFit = String(isFit);
    fitButton.textContent = isFit ? '확대 보기' : '화면에 맞추기';
    fitButton.setAttribute('aria-pressed', String(isFit));
    updateZoomPreservingFocus(previousViewport);
  });

  closeButton.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.documentElement.classList.remove('image-lightbox-open');
    expandedImage.removeAttribute('src');
    expandedImage.style.removeProperty('width');
    originalLink.removeAttribute('href');
    triggerImage?.focus();
    triggerImage = null;
  });
};
