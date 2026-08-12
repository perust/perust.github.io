const FIT_ZOOM_TOLERANCE = 0.01;
const IMAGE_READY_TIMEOUT_MS = 15000;

const originalSizeIcon = `
  <svg class="pswp-lightbox__control-icon" data-fit-original-icon="original" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
    <path d="M12 5v14M5 12h14" />
  </svg>`;

const fitSizeIcon = `
  <svg class="pswp-lightbox__control-icon" data-fit-original-icon="fit" aria-hidden="true" viewBox="0 0 24 24" hidden focusable="false">
    <path d="M5 12h14" />
  </svg>`;

const closeIcon = `
  <svg class="pswp__icn pswp-lightbox__control-icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" focusable="false">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>`;

const hasNaturalSize = (image) => image.naturalWidth > 0 && image.naturalHeight > 0;

export const isPhotoSwipeFitZoom = ({ currentZoom, fitZoom }) => (
  Number.isFinite(currentZoom)
  && Number.isFinite(fitZoom)
  && Math.abs(currentZoom - fitZoom) <= FIT_ZOOM_TOLERANCE
);

export const ensureImageReady = async (image, timeoutMs = IMAGE_READY_TIMEOUT_MS) => {
  if (hasNaturalSize(image)) return true;

  image.loading = 'eager';
  if (image.complete) return false;

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      resolve(hasNaturalSize(image));
    };
    const timeoutId = window.setTimeout(finish, timeoutMs);
    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });

    Promise.resolve().then(() => image.decode()).then(() => {
      if (hasNaturalSize(image) || image.complete) finish();
    }, () => {
      if (image.complete) finish();
    });
  });
};

const imageDimensions = (image) => ({
  width: image.naturalWidth || Number.parseInt(image.getAttribute('width') || '', 10) || 0,
  height: image.naturalHeight || Number.parseInt(image.getAttribute('height') || '', 10) || 0,
});

const imageSource = (image) => image.currentSrc || image.src;

export const setImageLightboxAvailability = (image, available) => {
  image.dataset.lightboxReady = String(available);
  if (!available) {
    image.removeAttribute('tabindex');
    image.removeAttribute('role');
    image.removeAttribute('aria-haspopup');
    image.removeAttribute('aria-label');
    return;
  }

  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-haspopup', 'dialog');
  image.setAttribute('aria-label', `${image.alt || '본문 이미지'} 이미지 크게 보기`);
};

const createSlideItem = (image) => {
  const src = imageSource(image);
  const { width, height } = imageDimensions(image);
  if (!src || width <= 0 || height <= 0) return null;

  return {
    src,
    msrc: src,
    width,
    height,
    alt: image.alt || '확대 이미지',
    element: image,
  };
};

const prepareSlideItems = async (images) => {
  const prepared = await Promise.all(images.map(async (image) => {
    if (image.dataset.lightboxReady === 'false') return null;
    const declaredSize = imageDimensions(image);
    if (declaredSize.width <= 0 || declaredSize.height <= 0) {
      await ensureImageReady(image);
    }
    const item = createSlideItem(image);
    setImageLightboxAvailability(image, Boolean(item));
    return item;
  }));

  return prepared.filter(Boolean);
};

const setFitOriginalState = (element, pswp) => {
  const currentZoom = pswp.currSlide?.currZoomLevel;
  const fitZoom = pswp.currSlide?.zoomLevels?.fit;
  const isFit = isPhotoSwipeFitZoom({ currentZoom, fitZoom });

  pswp.element?.setAttribute('data-image-fit', String(isFit));
  element.setAttribute('aria-label', isFit ? '원본 크기로 보기' : '화면에 맞추기');
  element.setAttribute('title', isFit ? '원본 크기로 보기' : '화면에 맞추기');
  element.querySelector('[data-fit-original-icon="original"]')?.toggleAttribute('hidden', !isFit);
  element.querySelector('[data-fit-original-icon="fit"]')?.toggleAttribute('hidden', isFit);
};

const registerFitOriginalControl = (lightbox) => {
  lightbox.on('uiRegister', () => {
    lightbox.pswp?.ui?.registerElement({
      name: 'fit-original',
      order: 1,
      isButton: true,
      appendTo: 'root',
      ariaLabel: '원본 크기로 보기',
      html: `${originalSizeIcon}${fitSizeIcon}`,
      onInit: (element, pswp) => {
        const update = () => setFitOriginalState(element, pswp);
        pswp.on('afterInit', update);
        pswp.on('change', update);
        pswp.on('zoomPanUpdate', update);
      },
      onClick: (_event, _element, pswp) => {
        const slide = pswp.currSlide;
        if (!slide) return;

        const isFit = isPhotoSwipeFitZoom({
          currentZoom: slide.currZoomLevel,
          fitZoom: slide.zoomLevels.fit,
        });
        slide.zoomTo(isFit ? 1 : slide.zoomLevels.fit, undefined, pswp.options.zoomAnimationDuration);
      },
    });
  });
};

const visibleDialogControls = (pswp) => Array.from(
  pswp.element?.querySelectorAll('button:not([disabled])') ?? [],
).filter((element) => element.getClientRects().length > 0);

const registerFocusWrap = (lightbox) => {
  lightbox.on('keydown', (event) => {
    const keyboardEvent = event.originalEvent;
    if (keyboardEvent.key !== 'Tab' || !lightbox.pswp) return;

    const controls = visibleDialogControls(lightbox.pswp);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;

    const activeElement = document.activeElement;
    const shouldWrapBackward = keyboardEvent.shiftKey
      && (activeElement === first || activeElement === lightbox.pswp.element);
    const shouldWrapForward = !keyboardEvent.shiftKey && activeElement === last;
    if (!shouldWrapBackward && !shouldWrapForward) return;

    keyboardEvent.preventDefault();
    event.preventDefault();
    (shouldWrapBackward ? last : first).focus();
  });
};

const createPhotoSwipeLightbox = async () => {
  const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox');
  const lightbox = new PhotoSwipeLightbox({
    pswpModule: () => import('photoswipe'),
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 1,
    maxZoomLevel: 4,
    wheelToZoom: true,
    pinchToClose: true,
    closeOnVerticalDrag: true,
    trapFocus: true,
    returnFocus: true,
    escKey: true,
    arrowKeys: true,
    imageClickAction: 'zoom',
    doubleTapAction: 'zoom',
    bgClickAction: 'close',
    closeTitle: '확대 이미지 닫기',
    arrowPrevTitle: '이전 이미지',
    arrowNextTitle: '다음 이미지',
    errorMsg: '이미지를 불러올 수 없습니다',
    indexIndicatorSep: ' / ',
    zoom: false,
    closeSVG: closeIcon,
    bgOpacity: 0.92,
  });

  registerFitOriginalControl(lightbox);
  registerFocusWrap(lightbox);
  lightbox.on('firstUpdate', () => {
    document.documentElement.classList.add('pswp-lightbox-open');
    lightbox.pswp?.element?.setAttribute('aria-modal', 'true');
    lightbox.pswp?.element?.setAttribute('aria-label', '본문 이미지 갤러리');
  });
  lightbox.on('destroy', () => {
    document.documentElement.classList.remove('pswp-lightbox-open');
  });
  lightbox.init();
  return lightbox;
};

export const initializeImageLightbox = () => {
  const images = Array.from(document.querySelectorAll('.post-article img')).filter((image) => (
    image.dataset.lightboxInitialized !== 'true'
    && !image.closest('a')
    && !image.hasAttribute('data-no-lightbox')
  ));
  if (images.length === 0) return;

  let lightboxPromise;
  let itemsPromise;
  let latestOpenRequest = 0;

  const getLightbox = () => {
    lightboxPromise ??= createPhotoSwipeLightbox().catch((error) => {
      lightboxPromise = undefined;
      throw error;
    });
    return lightboxPromise;
  };

  const getItems = () => {
    if (!itemsPromise) {
      const pendingItems = prepareSlideItems(images);
      itemsPromise = pendingItems;
      pendingItems.then(
        () => {
          if (itemsPromise === pendingItems) itemsPromise = undefined;
        },
        () => {
          if (itemsPromise === pendingItems) itemsPromise = undefined;
        },
      );
    }
    return itemsPromise;
  };

  const openImage = async (image, initialPoint) => {
    const request = ++latestOpenRequest;
    image.focus({ preventScroll: true });
    const [lightbox, items] = await Promise.all([getLightbox(), getItems()]);
    if (request !== latestOpenRequest) return;
    const index = items.findIndex((item) => item.element === image);
    if (index < 0) return;
    lightbox.loadAndOpen(index, items, initialPoint);
  };

  images.forEach((image) => {
    image.dataset.lightboxInitialized = 'true';
    setImageLightboxAvailability(image, !image.complete || hasNaturalSize(image));
    image.addEventListener('load', () => {
      if (hasNaturalSize(image)) setImageLightboxAvailability(image, true);
    });
    image.addEventListener('error', () => {
      if (!hasNaturalSize(image)) setImageLightboxAvailability(image, false);
    });
    image.addEventListener('click', (event) => {
      if (image.dataset.lightboxReady !== 'true') return;
      const initialPoint = { x: event.clientX, y: event.clientY };
      void openImage(image, initialPoint).catch((error) => console.error('PhotoSwipe를 열 수 없습니다.', error));
    });
    image.addEventListener('keydown', (event) => {
      if (image.dataset.lightboxReady !== 'true') return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      void openImage(image, null).catch((error) => console.error('PhotoSwipe를 열 수 없습니다.', error));
    });
  });
};
