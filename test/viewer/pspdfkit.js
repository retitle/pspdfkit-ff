import PSPDFKit from 'pspdfkit';

export const PSPDFKIT_URL =
  window.Glide && window.Glide.PSPDFKIT_URL
    ? `${window.Glide.PSPDFKIT_URL}${
        window.Glide.PSPDFKIT_URL.endsWith('/') ? '' : '/'
      }`
    : null;

export const BASE_CONFIG = {
  serverUrl: PSPDFKIT_URL,
  container: '#doc-viewer',
  instant: true,
  autoSaveMode: PSPDFKit.AutoSaveMode.DISABLED,
  disableTextSelection: true,
  editableAnnotationTypes: [PSPDFKit.Annotations.RectangleAnnotation],
  maxDefaultZoomLevel: 2.4,
  minDefaultZoomLevel: 1,
};

export const DEFAULT_ZOOM_LEVEL = 1.7; // normal

PSPDFKit.Options.IGNORE_DOCUMENT_PERMISSIONS = true;
export default PSPDFKit;
