import PSPDFKit, { BASE_CONFIG, DEFAULT_ZOOM_LEVEL } from './pspdfkit';
import PropTypes from 'prop-types';
import React, { Component, cloneElement, createRef } from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import classNames from 'classnames';
import { Alert } from 'antd';
import { inject, observer } from 'mobx-react';

const clsPrefix = 'app-pspdfkit-viewer';

const getInitialViewState = ({ hideThumbnails, startingZoom }) =>
  new PSPDFKit.ViewState({
    showToolbar: false,
    enableAnnotationToolbar: false,
    sidebarMode: !hideThumbnails ? PSPDFKit.SidebarMode.THUMBNAILS : undefined,
    sidebarPlacement: PSPDFKit.SidebarPlacement.END,
    formDesignMode: false,
    zoom: startingZoom || DEFAULT_ZOOM_LEVEL || 'FIT_TO_WIDTH',
  });

const ANNOTATION_FIELD_TYPES = _.get(
  window,
  'Glide.CONSTANTS.ANNOTATIONS.FIELD_TYPES',
  []
);

// in pixels. The minimum width of the pspdfkit content
// window that allows the sidebar to display
const CONTENT_WIDTH_SIDEBAR_THRESHOLD = 1290;

//@inject('annotations', 'store', 'ui', 'transactions')
@observer
export default class PspdfkitViewer extends Component {
  static propTypes = {
    transaction: PropTypes.object,
    transactions: PropTypes.object,
    annotations: PropTypes.object,
    doc: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    ui: PropTypes.object.isRequired,
    inFillMode: PropTypes.bool,
    ctas: PropTypes.any,
    hideThumbnails: PropTypes.bool,
    startingZoom: PropTypes.string,
    backgroundColor: PropTypes.string,
    banner: PropTypes.any,
    isDocumentEditLocked: PropTypes.bool,
    toolbar: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.shape({
        show: PropTypes.bool,
        withZoomControl: PropTypes.bool,
        withPageControls: PropTypes.bool,
        leftContent: PropTypes.any,
        leftContentProps: PropTypes.object,
        rightContent: PropTypes.any,
        rightContentProps: PropTypes.object,
      }),
    ]),
    // If set to true (default), code will ensure the container reaches the bottom of the page (this deals with issues on iphone safari)
    ensureFixedToBottom: PropTypes.bool,
  };
  static defaultProps = {
    inFillMode: true,
    ensureFixedToBottom: true,
  };

  state = {};

  ref = createRef();

  listeners = {
    'page.press': (event) => {
      const { nativeEvent } = event;
      if (_.get(nativeEvent, 'type') === 'touchend') {
        return;
      }
      this.handlePagePress(nativeEvent);
    },
    'viewState.change': (viewState) => {
      if (this.unmounted) {
        return;
      }
      this.setState({
        sidebarVisible: viewState.sidebarMode !== null,
      });
    },

    /* FIXME: implement a way to resize and reposition fill nodes
      after zoom changes
    */
    'viewState.zoom.change': () => {
      this.stopFilling();
    },
  };

  constructor(props) {
    super(props);
  }

  fillingState = {
    annotationId: null,
    formFieldName: null,
    overlayId: null,
  };

  componentDidMount = () => {
    this.setUpPsPdfKitInstance();
    document.body.addEventListener('click', this.handlePagePress);
    this.adjustBottomOffset();
    window.addEventListener('resize', this.adjustBottomOffsetDebounced);
  };

  componentDidUpdate() {
    this.adjustBottomOffsetDebounced();
  }

  componentWillUnmount = () => {
    this.unmounted = true;
    clearRenderConfigurations(true);
    this.removeListeners();
    this.unload();
    document.body.removeEventListener('click', this.handlePagePress);
    window.removeEventListener('resize', this.adjustBottomOffsetDebounced);
  };

  adjustBottomOffset = () => {
    // Hack to avoid iOS safari's footer overlap
    const { offset: currentOffset } = this.state;
    if (this.ref && this.ref.current) {
      const elem = this.ref.current;
      let offset = null;
      if (this.props.ensureFixedToBottom) {
        offset = elem.getBoundingClientRect().bottom - window.innerHeight;
        if (!(offset > 0)) {
          offset = null;
        }
      }
      if (offset !== currentOffset && !this.unmounted) {
        this.setState({
          offset,
        });
      }
    }
  };
  adjustBottomOffsetDebounced = _.debounce(this.adjustBottomOffset, 1000);

  get canUnloadPspdfkitInstance() {
    if (this._instance) {
      return true;
    }

    if (!BASE_CONFIG.container) {
      return false;
    }

    try {
      const container = document.querySelector(BASE_CONFIG.container);
      return container.childNodes.length > 0;
    } catch (err) {
      return false;
    }
  }

  unload = () => {
    if (this.canUnloadPspdfkitInstance) {
      PSPDFKit.unload(this._instance || BASE_CONFIG.container);
    }
  };

  setUpPsPdfKitInstance = async () => {
    const {
      doc,
      ui,
      annotations,
      transactions,
      hideThumbnails,
      dependentForms,
      mainNamespace,
      mainForm,
      transaction,
      startingZoom,
    } = this.props;
    const config = {
      ...BASE_CONFIG,
      initialViewState: getInitialViewState({
        hideThumbnails: !!hideThumbnails,
        startingZoom,
      }),
      documentId: doc.pspdfkit_document_id,
      authPayload: {
        jwt: doc.jwt_token,
      },
    };
    //this.unload();
    this._instance = await PSPDFKit.load(config);
    let renderOptions = {};
    if (transaction) {
      try {
        const transactionSettings = await transactions.getFetchTransactionSettings.getOrFetch(
          {
            transactionId: transaction.id,
          }
        );
        renderOptions = transactionSettings.renderOptions;
      } catch (err) {
        ui.wentWrong(err);
      }
    }
    addPspdfkitCss(this._instance);
    annotations.setPspdfkitInstance(
      this._instance,
      mainNamespace && mainForm
        ? {
            dependentForms,
            mainNamespace,
            mainForm,
            renderOptions,
          }
        : null,
      {
        includeAnnotationsTypes: ANNOTATION_FIELD_TYPES,
      },
      'fill'
    );
    annotations.setTransaction(transaction);
    Object.keys(this.listeners).forEach((eventName) => {
      this._instance.addEventListener(eventName, this.listeners[eventName]);
    });

    // prevent pinch-zoom
    this._instance.contentWindow.addEventListener(
      'wheel',
      (ev) => {
        if (ev.ctrlKey) {
          ev.stopPropagation();
        }
      },
      true
    );

    // Toggle the sidebar based on pspdfkit's content window width
    if (!this.props.hideThumbnails) {
      this._instance.contentWindow.addEventListener(
        'resize',
        _.throttle(() => {
          const width = this._instance.contentDocument.body.offsetWidth;
          const viewState = this._instance.viewState;

          if (
            width > CONTENT_WIDTH_SIDEBAR_THRESHOLD &&
            !viewState.sidebarMode
          ) {
            this._instance.setViewState((vs) =>
              vs.set('sidebarMode', PSPDFKit.SidebarMode.THUMBNAILS)
            );
          }

          if (
            width <= CONTENT_WIDTH_SIDEBAR_THRESHOLD &&
            viewState.sidebarMode
          ) {
            this._instance.setViewState((vs) => vs.set('sidebarMode', null));
          }
        }, 300)
      );

      if (
        this._instance.contentDocument.body.offsetWidth <=
        CONTENT_WIDTH_SIDEBAR_THRESHOLD
      ) {
        this._instance.setViewState((vs) => vs.set('sidebarMode', null));
      }

      this._instance.contentDocument.addEventListener(
        'pdf-annotation-click',
        this.handleFillingInit
      );
      this._instance.contentDocument.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab' || !this.fillingState.annotationId) {
          return;
        }

        if (event.target && event.target.closest('.ant-popover')) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.focusNext(event.shiftKey);
      });
    }

    if (!this.unmounted) {
      this.setState({
        toolbarKey: Math.floor(Math.random() * 1000000),
      });
    }

    // Fix for the sidebar scroll. It focuses on the second page when
    // there are more than 3 pages
    const sidebarEl = this._instance.contentDocument.querySelector(
      '.PSPDFKit-Sidebar > div:first-child'
    );
    if (sidebarEl) {
      sidebarEl.scrollTop = 0;
    }

    // Manually set listener on all touchstart events to make up for issue with
    // psPdfKit's 'page.press' being triggered at touchend, which causes wrong order of
    // handlers.
    const psPdfKitRoot = this._instance.contentDocument.querySelector(
      '.PSPDFKit-Root'
    );
    if (psPdfKitRoot) {
      psPdfKitRoot.addEventListener('touchstart', (event) =>
        this.handlePagePress(event)
      );
    }
  };

  handleFillingInit = async (event) => {
    const {
      detail: { annotationId, formFieldName, type },
    } = event;

    if (this.fillingState.annotationId !== annotationId) {
      this.stopFilling();
    }

    if (
      !ANNOTATION_FIELD_TYPES.includes(type.toUpperCase()) ||
      !formFieldName
    ) {
      return;
    }

    const formFieldAnnotations = this.props.annotations.formFieldAnnotations(
      formFieldName
    );
    const annotation = formFieldAnnotations.find(
      ({ id }) => id === annotationId
    );

    const { currentPageIndex } = this._instance.viewState;
    if (annotation && currentPageIndex !== annotation.pageIndex) {
      await this._instance.setViewState((state) =>
        state.set('currentPageIndex', annotation.pageIndex)
      );
    }

    const overlayItem = await createOutputWidgetNode(
      this.props.annotations,
      annotation,
      formFieldAnnotations,
      this.stopFilling,
      this.focusNext,
      this.props.store
    );

    if (overlayItem) {
      this.fillingState = {
        annotationId,
        formFieldName,
        overlayId: overlayItem.id,
        overlayNode: overlayItem.node,
      };
    }
  };

  stopFilling = () => {
    if (this.fillingState.overlayId && this._instance) {
      ReactDOM.unmountComponentAtNode(this.fillingState.overlayNode);
      this._instance.removeCustomOverlayItem(this.fillingState.overlayId);
    }

    const renderedAnnotationNode = (
      renderConfigurations[this.fillingState.annotationId] || {}
    ).node;

    if (renderedAnnotationNode) {
      renderedAnnotationNode.parentNode.style.zIndex = 'auto';
    }

    this.fillingState = {
      annotationId: null,
      formFieldName: null,
      overlayId: null,
      overlayNode: null,
    };
  };

  focusNext = (prev = false) => {
    const { annotations } = this.props;
    const nextAnnotation = annotations.getNextFillableAnnotation(
      annotations.getAnnotationById(this.fillingState.annotationId),
      prev
    );

    this.stopFilling();
    if (nextAnnotation) {
      this.handleFillingInit({
        detail: {
          annotationId: nextAnnotation.id,
          formFieldName: nextAnnotation.customData.formFieldName,
          type: nextAnnotation.customData.type,
        },
      });
    }
  };

  handlePagePress = (event) => {
    const srcElement = _.get(event, 'srcElement');

    if (!srcElement) {
      return;
    }

    if (srcElement.closest('.pdf-fill-node')) {
      return;
    }

    if (
      srcElement.closest(
        '.app-input-widget__dropdown--pdf,.ant-select-dropdown'
      )
    ) {
      return;
    }

    if (
      srcElement.closest(
        '.ant-modal-root,.ant-modal-wrap,.ant-modal-mask,.ant-modal'
      )
    ) {
      return;
    }

    this.stopFilling();
  };

  removeListeners = () => {
    const {
      annotations: { pspdfkitInstance },
    } = this.props;
    if (pspdfkitInstance) {
      Object.keys(this.listeners).forEach((eventName) => {
        const listener = this.listeners[eventName];
        pspdfkitInstance.removeEventListener(eventName, listener);
      });
    }
  };

  get inFillMode() {
    const { inFillMode, isDocumentEditLocked } = this.props;
    return !!inFillMode && !isDocumentEditLocked;
  }

  get toolbar() {
    const { toolbar } = this.props;
    return toolbar === undefined || toolbar === null || toolbar === false
      ? {}
      : toolbar;
  }

  get showToolbar() {
    return this.toolbar === true || !!this.toolbar.show !== false;
  }

  get withZoomControl() {
    return this.toolbar === true || this.toolbar.withZoomControl !== false;
  }

  get withPageControls() {
    return this.toolbar === true || this.toolbar.withPageControls !== false;
  }

  get toolbarLeftContent() {
    return this.toolbar.leftContent;
  }

  get toolbarLeftContentProps() {
    return this.toolbar.leftContentProps;
  }

  get toolbarRightContent() {
    return this.toolbar.rightContent;
  }

  get toolbarRightContentProps() {
    return this.toolbar.rightContentProps;
  }

  render() {
    return (
        <div
          id="doc-viewer"
        />
    );
  }
}
