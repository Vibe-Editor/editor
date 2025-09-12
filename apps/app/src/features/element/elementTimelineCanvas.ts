import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { consume, provide } from "@lit/context";
import {
  TimelineContentObject,
  timelineContext,
} from "../../context/timelineContext";
import { IUIStore, uiStore } from "../../states/uiStore";
import { darkenColor } from "../../utils/rgbColor";
import { TimelineController } from "../../controllers/timeline";
import { loadedAssetStore } from "../asset/loadedAssetStore";
import { IKeyframeStore, keyframeStore } from "../../states/keyframeStore";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";

interface ObjectClassType {
  [elementId: string]: number;
}

interface ObjectClassTrimType {
  [elementId: string]: {
    startTime: number;
    endTime: number;
  };
}

@customElement("element-timeline-canvas")
export class elementTimelineCanvas extends LitElement {
  targetId: string[];
  isDrag: boolean;
  firstClickPosition: { x: number; y: number };
  targetLastPosition: { x: number; y: number } | undefined;
  targetStartTime: ObjectClassType;
  targetDuration: ObjectClassType;
  targetTrack: ObjectClassType;
  targetMediaType: "static" | "dynamic" | undefined;
  cursorType: "none" | "move" | "moveNotGuide" | "stretchStart" | "stretchEnd";
  cursorNow: number;
  targetTrim: ObjectClassTrimType;
  timelineColor: {};
  canvasVerticalScroll: number;
  copyedTimelineData: {};
  isGuide: boolean;
  targetIdDuringRightClick: any;

  constructor() {
    super();

    this.targetId = [];
    this.targetIdDuringRightClick = [];
    this.targetStartTime = {};
    this.targetDuration = {};
    this.targetTrack = {};
    this.targetTrim = {};

    this.isDrag = false;
    this.isGuide = false;
    this.firstClickPosition = { x: 0, y: 0 };
    this.cursorType = "none";
    this.cursorNow = 0;
    this.timelineColor = {};
    this.canvasVerticalScroll = 0;
    this.copyedTimelineData = {};

    window.addEventListener("resize", this.drawCanvas);
    window.addEventListener("keydown", this._handleKeydown.bind(this));
    document.addEventListener(
      "mousedown",
      this._handleDocumentClick.bind(this),
    );
  }

  @query("#elementTimelineCanvasRef") canvas!: HTMLCanvasElement;

  @property({ attribute: false })
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property({ attribute: false })
  timeline: any = this.timelineState.timeline;

  @property({ attribute: false })
  timelineRange = this.timelineState.range;

  @property({ attribute: false })
  timelineScroll = this.timelineState.scroll;

  @property({ attribute: false })
  timelineCursor = this.timelineState.cursor;

  @property({ attribute: false })
  timelineHistory = this.timelineState.history;

  @property({ attribute: false })
  control = this.timelineState.control;

  @property({ attribute: false })
  isOpenAnimationPanelId: string[] = [];

  @property({ attribute: false })
  keyframeState: IKeyframeStore = keyframeStore.getInitialState();

  @property({ attribute: false })
  target = this.keyframeState.target;

  @property({ attribute: false })
  uiState: IUIStore = uiStore.getInitialState();

  @property({ attribute: false })
  resize = this.uiState.resize;

  @property({ attribute: false })
  renderOptionStore: IRenderOptionStore = renderOptionStore.getInitialState();

  @property({ attribute: false })
  renderOption = this.renderOptionStore.options;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions: any = {
    canvasVerticalScroll: 0,
    panelOptions: [],
  };

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineCursor = state.cursor;
      this.timelineScroll = state.scroll;
      this.timelineHistory = state.history;
      this.control = state.control;

      this.setTimelineColor();
      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.drawCanvas();
    });

    keyframeStore.subscribe((state) => {
      this.target = state.target;
    });

    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
    });

    // Re-draw when assets finish loading so previews appear
    loadedAssetStore.subscribe(() => {
      this.drawCanvas();
    });

    return this;
  }

  _handleDocumentClick(e) {
    // Temporarily disabled to test if this is causing the issue
    // TODO: Re-enable with proper logic later
    return;
    
    // Only clear selection if clicking outside the timeline canvas area
    const canvas = document.getElementById("elementTimelineCanvasRef");
    if (!canvas) return;
    
    // Check if click is on the canvas itself
    if (e.target === canvas) return;
    
    // Check if click is within timeline container
    const timelineContainer = e.target.closest('element-timeline') || 
                             e.target.closest('element-timeline-canvas');
    
    if (!timelineContainer) {
      console.log('Clearing selection - clicked outside timeline');
      this.targetId = [];
      this.drawCanvas();
    }
  }

  setTimelineColor() {
    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        if (!this.timelineColor.hasOwnProperty(key)) {
          // this.timelineColor[key] = this.getRandomColor();
          this.timelineColor[key] = this.timeline[key].timelineOptions.color;
        }
      }
    }
  }

  private getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  private getRandomColor() {
    let rgbMinColor = { r: 45, g: 23, b: 56 };
    let rgbMaxColor = { r: 167, g: 139, b: 180 };

    let rgb = {
      r: this.getRandomArbitrary(rgbMinColor.r, rgbMaxColor.r),
      g: this.getRandomArbitrary(rgbMinColor.g, rgbMaxColor.g),
      b: this.getRandomArbitrary(rgbMinColor.b, rgbMaxColor.b),
    };

    let rgbColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    return rgbColor;
  }

  private millisecondsToPx(ms) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertPixel = (ms / 5) * timeMagnification;
    const result = Number(convertPixel.toFixed(0));

    return result;
  }

  private pxToMilliseconds(px) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertMs = (px * 5) / timeMagnification;
    return Number(convertMs.toFixed(0));
  }

  private wrapText(ctx, text, x, y, maxWidth) {
    let ellipsis = "...";
    let truncatedText = text;

    if (ctx.measureText(text).width > maxWidth) {
      while (ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
        truncatedText = truncatedText.slice(0, -1);
      }
      truncatedText += ellipsis;
    }

    const fontSize = 14;
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 0;
    ctx.font = `${fontSize}px "Noto Sans"`;
    ctx.fillText(truncatedText, x, y);
  }

  private deepCopy(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      const copy: any = [];
      obj.forEach((element, index) => {
        copy[index] = this.deepCopy(element);
      });
      return copy;
    } else {
      const copy = {};
      Object.keys(obj).forEach((key) => {
        copy[key] = this.deepCopy(obj[key]);
      });
      return copy;
    }
  }

  private copySeletedElement() {
    if (this.targetId.length == 1) {
      let selected = {};

      let changedUUID = uuidv4();

      selected[changedUUID] = this.deepCopy(this.timeline[this.targetId[0]]);

      this.copyedTimelineData = selected;
    }
  }

  private splitSeletedElement() {
    if (this.targetId.length != 1) {
      return false;
    }

    let selected = {};
    const timelineRange = this.timelineRange;
    const timelineCursor = this.timelineCursor;
    const timeMagnification = timelineRange / 4;
    const convertMs = (timelineCursor * 5) / timeMagnification;
    let curserLeft = this.timelineCursor;

    let changedUUID = uuidv4();
    selected[changedUUID] = this.deepCopy(this.timeline[this.targetId[0]]);

    if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
      "dynamic"
    ) {
      let targetElementTrimStartTime =
        curserLeft -
        (selected[changedUUID].trim.startTime +
          selected[changedUUID].startTime);
      selected[changedUUID].trim.startTime += targetElementTrimStartTime;

      this.timeline[this.targetId[0]].trim.endTime =
        selected[changedUUID].trim.startTime;
    } else if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
      "static"
    ) {
      let targetElementStartTime = curserLeft - selected[changedUUID].startTime;

      selected[changedUUID].startTime += targetElementStartTime;
      selected[changedUUID].duration =
        selected[changedUUID].duration - targetElementStartTime;

      let originElementDuration =
        this.timeline[this.targetId[0]].duration -
        selected[changedUUID].duration;

      this.timeline[this.targetId[0]].duration = originElementDuration;
    }

    this.copyedTimelineData = selected;
  }

  public splitAtCursor() {
    if (this.targetId.length !== 1) {
      return false;
    }

    this.splitSeletedElement();

    for (const elementId in this.copyedTimelineData) {
      if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
        let tempCopyObject: any = this.copyedTimelineData[elementId];
        tempCopyObject.priority = this.getNowPriority();

        this.timeline[elementId] = { ...tempCopyObject };
        this.timelineState.patchTimeline(this.timeline);
        this.timelineState.checkPointTimeline();
      }
    }

    const newIds = Object.keys(this.copyedTimelineData);
    if (newIds.length === 1) {
      this.targetId = [newIds[0]];
    }

    this.drawCanvas();
  }

  drawCursor() {
    const ctx: any = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const now =
      this.millisecondsToPx(this.timelineCursor) - this.timelineScroll;

    ctx.fillStyle = "#dbdaf0";
    ctx.beginPath();
    ctx.rect(now, 0, 2, height);
    ctx.fill();
  }

  drawEndTimeline() {
    const projectDuration = this.renderOption.duration;

    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;

    const ctx: any = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const end =
      ((projectDuration * 1000) / 5) * timeMagnification - this.timelineScroll;

    ctx.fillStyle = "#ff173e";
    ctx.beginPath();
    ctx.rect(end, 0, 2, height);
    ctx.fill();
  }

  drawActive(ctx, elementId, left, top, width, height) {
    const activeHeight = 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.rect(left, top + height - activeHeight, width, activeHeight);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left, top, width, activeHeight);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left, top, activeHeight, height);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left + width - activeHeight, top, activeHeight, height);
    ctx.fill();
    ctx.fillStyle = this.timelineColor[elementId];
    ctx.strokeStyle = this.timelineColor[elementId];
    ctx.lineWidth = 0;
  }

  drawCanvas() {
    if (!this.canvas) return;

    let index = 0;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;
      this.canvas.style.width = `${window.innerWidth}px`;

      this.canvas.width = window.innerWidth * dpr;

      // Ensure displayed size follows internal resolution

      // Determine number of timeline rows
      let rows: number;
      const highestTrack = Object.values(this.timeline).length > 0
        ? Math.max(
            ...Object.values(this.timeline).map((el: any) => (el.track ?? 0) + 1),
            1,
          )
        : 0;
      // Always show at least 3 rows; expand further if more tracks are used
      rows = Math.max(highestTrack, 3);
      const parentHeight = rows * 36; // 30px clip height + ~20% padding
      this.canvas.height = parentHeight * dpr;

      // Reflect calculated height in CSS so the element is actually visible
      this.canvas.style.height = `${parentHeight}px`;

      // Also make sure the host timeline element can scroll vertically if needed
      const parentTimeline = document.querySelector("element-timeline") as HTMLElement;
      if (parentTimeline) {
        parentTimeline.style.height = `${parentHeight}px`;
      }

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Reset any existing transform before applying new scaling to avoid cumulative scaling.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Helper to draw preview while preserving aspect ratio (letterbox)
      const drawPreview = (
        source: HTMLImageElement | HTMLCanvasElement,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
      ) => {
        const srcW = source.width;
        const srcH = source.height;
        if (!srcW || !srcH) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(dx, dy, dw, dh);
        ctx.clip();
        const scale = Math.max(dw / srcW, dh / srcH); // cover strategy
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const offsetX = dx + (dw - drawW) / 2;
        const offsetY = dy + (dh - drawH) / 2;
        ctx.drawImage(source, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      };


      // Draw row grid lines only when timeline is empty to avoid duplicate lines.
      const ROW_H = 30;
      const ROW_SPACING = ROW_H * 1.2;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= rows; i++) {
        const y = i * ROW_SPACING;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvas.width / dpr, y);
        ctx.stroke();
      }

      const sortedTimeline = Object.fromEntries(
        Object.entries(this.timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      for (const elementId in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
          const ROW_H = 30;
          const ROW_SPACING = ROW_H * 1.2;
          const verticalMargin = (ROW_SPACING - ROW_H) / 2;
          const height = ROW_H;
          // Calculate row position so clip is vertically centered within row
          const track = (this.timeline[elementId].track ?? 0);
          const topOffset = 2; // Minimal offset - first row should be very close to ruler
          const top = track * ROW_SPACING + verticalMargin - this.canvasVerticalScroll + topOffset;
          const left =
            this.millisecondsToPx(this.timeline[elementId].startTime) -
            this.timelineScroll;

          const filetype = this.timeline[elementId].filetype;

          let elementType = elementUtils.getElementType(filetype);

          ctx.lineWidth = 0;

          if (elementType == "static") {
            const width = this.millisecondsToPx(
              this.timeline[elementId].duration,
            );

            let additionalLeft = 0;

            if (filetype == "text") {
              if (this.timeline[elementId].parentKey != "standalone") {
                const parentStartTime =
                  this.timeline[this.timeline[elementId].parentKey].startTime;
                additionalLeft = this.millisecondsToPx(parentStartTime);
              }
            }

            const finalLeft = left + additionalLeft;

            ctx.strokeStyle = this.timelineColor[elementId];
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(finalLeft, top, width, height, 4);
            } else {
              // Fallback path for older browsers
              ctx.rect(finalLeft, top, width, height);
            }
            ctx.stroke();
            // Draw preview frame for images / gifs
            if (filetype === "image") {
              const imgStore = loadedAssetStore.getState();
              let img = imgStore.getImage(this.timeline[elementId].localpath);
              if (!img) {
                // kick off async load; preview will show once loaded
                imgStore.loadImage(this.timeline[elementId].localpath).catch(() => {});
              } else {
                drawPreview(img, finalLeft, top, width, height);
              }
            } else if (filetype === "gif") {
              const assetStore = loadedAssetStore.getState();
              let frames = assetStore.getGif(this.timeline[elementId].localpath);
              if (!frames) {
                assetStore.loadGif(this.timeline[elementId].localpath).catch(() => {});
              }
              if (frames?.length) {
                const frame = frames[0];
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = frame.imageData.width;
                tempCanvas.height = frame.imageData.height;
                tempCanvas.getContext("2d")?.putImageData(frame.imageData, 0, 0);
                drawPreview(tempCanvas, finalLeft, top, width, height);
              }
            }

            if (this.targetId.includes(elementId)) {
              this.drawActive(ctx, elementId, finalLeft, top, width, height);
            }
          } else if (elementType == "dynamic") {
            const width = this.millisecondsToPx(
              this.timeline[elementId].trim.endTime -
                this.timeline[elementId].trim.startTime,
            );

            ctx.strokeStyle = this.timelineColor[elementId];
            ctx.lineWidth = 2;

            const adjustedLeft =
              this.millisecondsToPx(this.timeline[elementId].startTime + this.timeline[elementId].trim.startTime) -
              this.timelineScroll;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(adjustedLeft, top, width, height, 4);
            } else {
              ctx.rect(adjustedLeft, top, width, height);
            }
            ctx.stroke();
            // Draw preview frame for video clips
            {
              const store = loadedAssetStore.getState();
              let meta = store.getElementVideo(elementId);
              if (!meta) {
                store.loadElementVideo(elementId, this.timeline[elementId]).catch(() => {});
              } else if (meta.canvas) {
                drawPreview(meta.canvas, adjustedLeft, top, width, height);
              }
            }

            if (this.targetId.includes(elementId)) {
              this.drawActive(ctx, elementId, adjustedLeft, top, width, height);
            }
            // Skip shading for trimmed areas since we no longer fill bars.
          }

          // Draw horizontal separation line for each timeline row
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, top + height + verticalMargin);
          ctx.lineTo(this.canvas.width / dpr, top + height + verticalMargin);
          ctx.stroke();

          const isActive = this.isActiveAnimationPanel(elementId);

          if (isActive) {
            index += 1;

            const panelTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.position.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.position.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            for (
              let indexY = 0;
              indexY < this.timeline[elementId].animation.position.y.length;
              indexY++
            ) {
              const element =
                this.timeline[elementId].animation.position.y[indexY];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelOpacityTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelOpacityTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.opacity.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.opacity.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelOpacityTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelScaleTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelScaleTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.scale.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.scale.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelScaleTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelRotationTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelRotationTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.rotation.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.rotation.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelRotationTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          }

          index += 1;
        }
      }

      this.drawEndTimeline();
      this.drawCursor();
    }
  }

  deactivateAnimationPanel(elementId) {
    const panelOptions = this.timelineOptions.panelOptions.filter((item) => {
      return item.elementId != elementId;
    });

    this.timelineOptions.panelOptions = panelOptions;
  }

  activateAnimationPanel(elementId) {
    this.timelineOptions.panelOptions.push({
      elementId: elementId,
      activeAnimation: true,
    });
  }

  isActiveAnimationPanel(elementId) {
    return (
      this.timelineOptions.panelOptions.findIndex((item) => {
        return item.elementId == elementId;
      }) != -1
    );
  }

  private guide({
    element,
    filetype,
    elementBarPosition,
    targetId,
    targetElementType,
  }) {
    let startX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime)
        : this.millisecondsToPx(element.startTime + element.trim.startTime);
    let endX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime + element.duration)
        : this.millisecondsToPx(element.startTime + element.trim.endTime);
    let checkRange = 10;

    let isGuide = false;

    if (
      elementBarPosition.startX > startX - checkRange &&
      elementBarPosition.startX < startX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? startX
          : startX -
            this.millisecondsToPx(this.timeline[targetId].trim.startTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
    }

    if (
      elementBarPosition.startX > endX - checkRange &&
      elementBarPosition.startX < endX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? endX
          : endX -
            this.millisecondsToPx(this.timeline[targetId].trim.startTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);

      isGuide = true;
    }

    if (
      elementBarPosition.endX > startX - checkRange &&
      elementBarPosition.endX < startX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? startX - this.millisecondsToPx(this.timeline[targetId].duration)
          : startX -
            this.millisecondsToPx(this.timeline[targetId].trim.endTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
    }

    if (
      elementBarPosition.endX > endX - checkRange &&
      elementBarPosition.endX < endX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? endX - this.millisecondsToPx(this.timeline[targetId].duration)
          : endX - this.millisecondsToPx(this.timeline[targetId].trim.endTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
    }

    this.isGuide = isGuide;
  }

  private magnet({ targetId, px }: { targetId: string; px: number }) {
    let targetElementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    let startX =
      targetElementType == "static"
        ? this.millisecondsToPx(this.timeline[targetId].startTime)
        : this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].trim.startTime,
          );
    let endX =
      targetElementType == "static"
        ? this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].duration,
          )
        : this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].trim.endTime,
          );

    let elementBarPosition = {
      startX: startX,
      endX: endX,
    };

    for (const timelineKey in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, timelineKey)) {
        if (timelineKey == targetId) {
          continue;
        }

        const element = this.timeline[timelineKey];
        const elementType = elementUtils.getElementType(element.filetype);
        this.guide({
          element: element,
          filetype: elementType,
          elementBarPosition: elementBarPosition,
          targetElementType: targetElementType,
          targetId: targetId,
        });
      }
    }
  }

  updateTargetPosition({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].startTime =
      this.targetStartTime[targetId] + this.pxToMilliseconds(dx);
  }

  updateTargetStartStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (
        this.targetDuration[targetId] - this.pxToMilliseconds(dx) <=
        minDuration
      ) {
        return false;
      }

      this.timeline[targetId].startTime =
        this.targetStartTime[targetId] + this.pxToMilliseconds(dx);
      this.timeline[targetId].duration =
        this.targetDuration[targetId] - this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      // Safety check: ensure targetTrim is properly initialized
      if (!this.targetTrim[targetId] || this.targetTrim[targetId].startTime === undefined) {
        console.warn('targetTrim not properly initialized for', targetId, 'reinitializing...');
        this.targetTrim[targetId] = {
          startTime: this.timeline[targetId].trim.startTime,
          endTime: this.timeline[targetId].trim.endTime,
        };
      }

      if (this.targetTrim[targetId].startTime + this.pxToMilliseconds(dx) > 0) {
        this.timeline[targetId].startTime = this.targetStartTime[targetId];
        this.timeline[targetId].trim.startTime =
          this.targetTrim[targetId].startTime + this.pxToMilliseconds(dx);
      }
    }
  }

  updateTargetEndStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (
        this.targetDuration[targetId] + this.pxToMilliseconds(dx) <=
        minDuration
      ) {
        return false;
      }

      this.timeline[targetId].startTime = this.targetStartTime[targetId];
      this.timeline[targetId].duration =
        this.targetDuration[targetId] + this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      // Safety check: ensure targetTrim is properly initialized
      if (!this.targetTrim[targetId] || this.targetTrim[targetId].endTime === undefined) {
        console.warn('targetTrim not properly initialized for', targetId, 'reinitializing...');
        this.targetTrim[targetId] = {
          startTime: this.timeline[targetId].trim.startTime,
          endTime: this.timeline[targetId].trim.endTime,
        };
      }

      if (
        this.targetTrim[targetId].endTime + this.pxToMilliseconds(dx) <
        this.targetDuration[targetId] / this.timeline[targetId].speed
      ) {
        this.timeline[targetId].startTime = this.targetStartTime[targetId];
        this.timeline[targetId].trim.endTime =
          this.targetTrim[targetId].endTime + this.pxToMilliseconds(dx);
      }
    }
  }

  findTarget({ x, y }: { x: number; y: number }): {
    targetId: string;
    cursorType: "none" | "move" | "stretchStart" | "stretchEnd";
  } {
    let index = 0;
    let targetId = "";
    let cursorType = "none";

    const sortedTimeline = Object.fromEntries(
      Object.entries(this.timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    for (const elementId in sortedTimeline) {
      if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
        // Calculate width based on element type
        let defaultWidth;
        const elementType = elementUtils.getElementType(this.timeline[elementId].filetype);
        if (elementType === "dynamic") {
          // For dynamic elements (videos), use trimmed duration
          defaultWidth = this.millisecondsToPx(
            this.timeline[elementId].trim.endTime - this.timeline[elementId].trim.startTime
          );
        } else {
          // For static elements, use full duration
          defaultWidth = this.millisecondsToPx(this.timeline[elementId].duration);
        }

        let additionalLeft = 0;

        if (this.timeline[elementId].filetype == "text") {
          if (this.timeline[elementId].parentKey != "standalone") {
            const parentStartTime =
              this.timeline[this.timeline[elementId].parentKey].startTime;
            additionalLeft = this.millisecondsToPx(parentStartTime);
          }
        }

        const defaultHeight = 30;
        // All clips share the same vertical track, so Y is constant.
        const track = (this.timeline[elementId].track ?? 0);
        const startY = track * defaultHeight * 1.2 - this.canvasVerticalScroll;
        
        // Calculate startX based on element type
        let startX;
        if (elementType === "dynamic") {
          // For dynamic elements (videos), start position includes trim offset
          startX = this.millisecondsToPx(
            this.timeline[elementId].startTime + this.timeline[elementId].trim.startTime
          ) - this.timelineScroll + additionalLeft;
        } else {
          // For static elements, use start time directly
          startX = this.millisecondsToPx(this.timeline[elementId].startTime) -
            this.timelineScroll + additionalLeft;
        }

        const endX = startX + defaultWidth;
        const endY = startY + defaultHeight;
        const stretchArea = 10;

        if (
          x > startX - stretchArea &&
          x < endX + stretchArea &&
          y > startY &&
          y < endY
        ) {
          targetId = elementId;
          let elementType = elementUtils.getElementType(
            this.timeline[elementId].filetype,
          );

          if (elementType == "static") {
            if (x > startX - stretchArea && x < startX + stretchArea) {
              return { targetId: targetId, cursorType: "stretchStart" };
            } else if (x > endX - stretchArea && x < endX + stretchArea) {
              return { targetId: targetId, cursorType: "stretchEnd" };
            } else {
              return { targetId: targetId, cursorType: "move" };
            }
          } else if (elementType == "dynamic") {
            // For dynamic elements (videos), calculate positions exactly as they are rendered
            const trimmedWidth = this.millisecondsToPx(
              this.timeline[elementId].trim.endTime - this.timeline[elementId].trim.startTime
            );
            const adjustedStartX = this.millisecondsToPx(
              this.timeline[elementId].startTime + this.timeline[elementId].trim.startTime
            ) - this.timelineScroll;
            const adjustedEndX = adjustedStartX + trimmedWidth;
            
            if (
              x > adjustedStartX - stretchArea &&
              x < adjustedStartX + stretchArea
            ) {
              return { targetId: targetId, cursorType: "stretchStart" };
            } else if (
              x > adjustedEndX - stretchArea &&
              x < adjustedEndX + stretchArea
            ) {
              return { targetId: targetId, cursorType: "stretchEnd" };
            } else {
              return { targetId: targetId, cursorType: "move" };
            }
          }
        }

        const isActive = this.isActiveAnimationPanel(elementId);

        if (isActive) {
          index += 4;
        }

        index += 1;
      }
    }

    return { targetId: "", cursorType: "none" };
  }

  public openAnimationPanel(targetId: string, animationType) {
    this.isOpenAnimationPanelId.push(targetId);

    let timelineOptionOffcanvas = new bootstrap.Offcanvas(
      document.getElementById("option_bottom"),
    );
    let targetElementId = document.querySelector(
      "#timelineOptionTargetElement",
    );

    this.keyframeState.update({
      elementId: targetId,
      animationType: animationType,
      isShow: true,
    });

    targetElementId.value = targetId;
    timelineOptionOffcanvas.show();
  }

  public closeAnimationPanel(targetId: string) {
    this.isOpenAnimationPanelId = this.isOpenAnimationPanelId.filter(
      (item) => !item.includes(targetId),
    );
  }

  animationPanelDropdownTemplate() {
    if (this.targetId.length != 1) {
      return "";
    }

    if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
        "dynamic" ||
      this.timeline[this.targetId[0]].filetype == "text"
    ) {
      return "";
    }

    let isShowPanel = this.isShowAnimationPanel();
    let itemName = isShowPanel == true ? "close animation" : "open animation";
    let itemOnclickEvent =
      isShowPanel == true
        ? `document.querySelector('element-timeline-canvas').closeAnimationPanel('${this.targetId}')`
        : `document.querySelector('element-timeline-canvas').openAnimationPanel('${this.targetId}')`;

    let template = `<menu-dropdown-item onclick=${itemOnclickEvent} item-name="${itemName}"></menu-dropdown-item>`;
    return template;
  }

  isShowAnimationPanel() {
    const index = this.isOpenAnimationPanelId.findIndex((item) => {
      return this.targetId.includes(item);
    });

    return index != -1;
  }

  showMenuDropdown({ x, y }) {
    document.querySelector("#menuRightClick").innerHTML = `
        <menu-dropdown-body top="${y}" left="${x}">
        ${this.animationPanelDropdownTemplate()}
          <menu-dropdown-item onclick="document.querySelector('element-timeline-canvas').splitAtCursor()" item-name="split at cursor"> </menu-dropdown-item>
          <menu-dropdown-item onclick="document.querySelector('element-timeline-canvas').removeSeletedElements()" item-name="remove"> </menu-dropdown-item>
        </menu-dropdown-body>`;
  }

  showSideOption(elementId: string) {
    const optionGroup = document.querySelector("option-group");
    const fileType = this.timeline[elementId].filetype;
    let isAllText = true;

    for (let index = 0; index < this.targetId.length; index++) {
      const element = this.targetId[index];
      const itrFileType = this.timeline[elementId].filetype;
      if (itrFileType != "text") {
        isAllText = false;
      }
    }

    console.log(fileType == "text", isAllText);

    if (fileType == "text" && isAllText) {
      optionGroup.showOptions({
        filetype: fileType,
        elementIds: this.targetId,
      });

      return false;
    }

    optionGroup.showOption({
      filetype: fileType,
      elementId: elementId,
    });
  }

  whenRightClick(e) {
    const isRightClick = e.which == 3 || e.button == 2;

    this.targetIdDuringRightClick = [...this.targetId];

    if (!isRightClick) {
      return 0;
    }

    this.showMenuDropdown({
      x: e.clientX,
      y: e.clientY,
    });
  }

  exchangePriority(targetId, next) {
    // next is -1 (up) or 1 (down)
    const targetEl = this.timeline[targetId];
    if (!targetEl) return;

    const newTrack = Math.max((targetEl.track ?? 0) + next, 0);
    targetEl.track = newTrack;

    // keep store in sync
    this.timelineState.patchTimeline(this.timeline);
  }

  getNowPriority() {
    if (Object.keys(this.timeline).length == 0) {
      return 1;
    }

    let lastPriority: any = 1;

    for (const key in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        lastPriority =
          lastPriority < (element.priority as number)
            ? element.priority
            : lastPriority;
      }
    }

    return lastPriority + 1;
  }

  searchChildrenKey(searchKey) {
    let hasChild = false;

    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        if (element.filetype == "text") {
          if (element.parentKey == searchKey) {
            hasChild = true;
          }
        }
      }
    }

    return hasChild;
  }

  public removeSeletedElements() {
    let isAbleRemove = true;

    for (const key in this.targetIdDuringRightClick) {
      if (
        Object.prototype.hasOwnProperty.call(this.targetIdDuringRightClick, key)
      ) {
        const element = this.targetIdDuringRightClick[key];
        const hasChild = this.searchChildrenKey(element);
        if (!hasChild) {
          this.timelineState.removeTimeline(element);
        }
      }
    }
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;

    if (e.ctrlKey) {
      e.preventDefault();
      const dx = parseFloat(e.deltaY) * (this.timelineRange / 75);
      const x = this.timelineRange - dx;

      if (e.deltaY < 0) {
        if (x < 5) {
          this.timelineState.setRange(x);
        }
      } else {
        if (x > -8) {
          this.timelineState.setRange(x);
        }
      }
    } else {
      if (this.canvasVerticalScroll + e.deltaY > 0) {
        this.canvasVerticalScroll += e.deltaY;
        this.timelineOptions.canvasVerticalScroll += e.deltaY;
        this.drawCanvas();
      }

      if (newScroll >= 0) {
        this.timelineState.setScroll(newScroll);
      } else {
        this.timelineState.setScroll(0);
      }
    }
  }

  _handleMouseMove(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    const target = this.findTarget({ x: x, y: y });
    const cursorType = target.cursorType;

    if (cursorType == "move") {
      this.style.cursor = "pointer";
    } else if (cursorType == "stretchEnd" || cursorType == "stretchStart") {
      this.style.cursor = "ew-resize";
    } else {
      this.style.cursor = "default";
    }

    if (this.isDrag) {
      const dx = x - this.firstClickPosition.x;
      const dy = y - this.firstClickPosition.y;
      const rowHeight = 30 * 1.2;
      const trackOffset = Math.round(dy / rowHeight);

      for (const key in this.targetId) {
        if (Object.prototype.hasOwnProperty.call(this.targetId, key)) {
          const target = this.targetId[key];
          if (this.cursorType == "move") {
            this.updateTargetPosition({ targetId: target, dx: dx });
            this.magnet({ targetId: target, px: dx });
          } else if (this.cursorType == "moveNotGuide") {
            this.updateTargetPosition({ targetId: target, dx: dx });
          } else if (this.cursorType == "stretchStart") {
            this.updateTargetStartStretch({ targetId: target, dx: dx });
          } else if (this.cursorType == "stretchEnd") {
            this.updateTargetEndStretch({ targetId: target, dx: dx });
          }

          // vertical track movement
          if (trackOffset !== 0) {
            const baseTrack = this.targetTrack[target] ?? 0;
            const newTrack = Math.max(baseTrack + trackOffset, 0);
            this.timeline[target].track = newTrack;
          }

          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }
  }

  _handleMouseDown(e) {
    try {
      this.timelineState.setCursorType("pointer");

      const x = e.offsetX;
      const y = e.offsetY;

      const target = this.findTarget({ x: x, y: y });
      console.log('Mouse down - target found:', target);

      if (e.shiftKey && target.targetId != "") {
        this.targetId.push(target.targetId);
        this.cursorType = target.cursorType;
        if (target.cursorType == "move" && this.targetId.length > 1) {
          this.cursorType = "moveNotGuide";
        }
      } else if (this.targetId.includes(target.targetId)) {
        // 타겟 ID가 포함된 엘리먼트를 클릭했을때, 시프트 키 없이도 움직이도록.
        this.cursorType = target.cursorType;
        if (target.cursorType == "move" && this.targetId.length > 1) {
          this.cursorType = "moveNotGuide";
        }
      } else {
        if (target.targetId == "") {
          this.targetId = [];
          this.cursorType = target.cursorType;
        } else {
          this.targetId = [target.targetId];
          this.cursorType = target.cursorType;
        }
      }

      this.showSideOption(this.targetId[0]);

      this.targetId = [...new Set(this.targetId)];

      this.firstClickPosition.x = e.offsetX;
      this.firstClickPosition.y = e.offsetY;

      for (let index = 0; index < this.targetId.length; index++) {
        const elementId = this.targetId[index];
        this.targetStartTime[elementId] = this.timeline[elementId].startTime;
        this.targetDuration[elementId] = this.timeline[elementId].duration;
        this.targetTrack[elementId] = (this.timeline[elementId].track ?? 0);

        let elementType = elementUtils.getElementType(
          this.timeline[elementId].filetype,
        );

        if (elementType == "dynamic") {
          this.targetTrim[elementId] = {
            startTime: this.timeline[elementId].trim.startTime,
            endTime: this.timeline[elementId].trim.endTime,
          };
          // this.targetTrim.startTime =
          //   this.timeline[this.targetId[0]].trim.startTime;
          // this.targetTrim.endTime = this.timeline[this.targetId[0]].trim.endTime;
        }
      }

      this.drawCanvas();

      this.isDrag = true;
    } catch (error) {
      this.drawCanvas();

      this.isDrag = true;
    }
  }

  _handleMouseUp(e) {
    this.isDrag = false;
  }

  _handleKeydown(event) {
    console.log(event.keyCode);

    // arrowUp

    if (event.keyCode == 38) {
      console.log(this.targetId);
      console.log(this.timeline);
      this.exchangePriority(this.targetId, -1);
    }

    // arrowDown

    if (event.keyCode == 40) {
      console.log(this.targetId);
      this.exchangePriority(this.targetId, 1);
    }

    if (event.keyCode == 39) {
      if (this.control.cursorType != "pointer") {
        return false;
      }

      const elementControl = document.querySelector("element-control");

      elementControl.progress = this.timelineScroll + 1000 / 60;

      elementControl.stop();
      elementControl.appearAllElementInTime();
      this.timelineState.increaseCursor(1000 / 60);
    }

    // arrowBack
    if (event.keyCode == 37) {
      if (this.control.cursorType != "pointer") {
        return false;
      }
      const elementControl = document.querySelector("element-control");

      elementControl.progress = this.timelineScroll - 1000 / 60;

      elementControl.stop();
      elementControl.appearAllElementInTime();

      this.timelineState.decreaseCursor(1000 / 60);
    }

    if (event.keyCode == 49) {
      // 1
      console.log(this.timelineHistory, this.timeline);

      const sortd = Object.fromEntries(
        Object.entries(useTimelineStore.getState().timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      for (const key in sortd) {
        if (Object.prototype.hasOwnProperty.call(sortd, key)) {
          const element = sortd[key];
          console.log(key);
        }
      }
    }

    if (event.keyCode == 8) {
      // backspace
      // event.preventDefault();
      for (const key in this.targetId) {
        if (Object.prototype.hasOwnProperty.call(this.targetId, key)) {
          const element = this.targetId[key];
          const hasChild = this.searchChildrenKey(element);
          if (!hasChild) {
            this.timelineState.removeTimeline(element);
          }
        }
      }

      this.timelineState.checkPointTimeline();
    }

    if (!event.shiftKey && event.ctrlKey && event.keyCode == 90) {
      //CTL z
      console.log(this.timelineHistory.timelineHistory, "EE");
      if (
        this.timelineHistory.historyNow - 1 == -1 ||
        this.timelineHistory.timelineHistory.length <
          this.timelineHistory.historyNow
      ) {
        return;
      }
      this.timelineState.rollbackTimelineFromCheckPoint(-1);
    }

    if (event.shiftKey && event.ctrlKey && event.keyCode == 90) {
      //CTL z
      console.log(
        this.timelineHistory.timelineHistory.length,
        this.timelineHistory.historyNow,
      );
      if (
        this.timelineHistory.timelineHistory.length <=
        this.timelineHistory.historyNow + 1
      ) {
        return;
      }
      this.timelineState.rollbackTimelineFromCheckPoint(1);
    }

    if (event.ctrlKey && event.keyCode == 86) {
      //CTL v
      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          let tempCopyObject = this.copyedTimelineData[elementId];
          tempCopyObject.priority = this.getNowPriority();

          this.timeline[elementId] = { ...tempCopyObject };
          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }

    if (event.ctrlKey && event.keyCode == 67) {
      //CTL c
      console.log("SS");
      this.copySeletedElement();
    }

    if (event.ctrlKey && event.keyCode == 88) {
      //CTL x

      this.copySeletedElement();

      for (const key in this.targetId) {
        if (Object.prototype.hasOwnProperty.call(this.targetId, key)) {
          const element = this.targetId[key];
          const hasChild = this.searchChildrenKey(element);
          if (!hasChild) {
            this.timelineState.removeTimeline(element);
          }
        }
      }
    }

    if (event.ctrlKey && event.keyCode == 68) {
      //CTL d
      this.splitSeletedElement();

      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          let tempCopyObject = this.copyedTimelineData[elementId];
          tempCopyObject.priority = this.getNowPriority();

          this.timeline[elementId] = { ...tempCopyObject };
          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }
  }

  _handleContextmenu(e) {
    this.whenRightClick(e);
  }

  renderAnimationPanel() {
    //this.isOpenAnimationPanelId
    return html``;
  }

  renderCanvas() {
    const canvasWidth = window.innerWidth - this.resize.timelineVertical.leftOption;
    return html`
      <canvas
        id="elementTimelineCanvasRef"
        style="width: ${canvasWidth}px;left: ${this.resize.timelineVertical
          .leftOption}px;position: absolute;top: 60px;"
        @mousewheel=${this._handleMouseWheel}
        @mousemove=${this._handleMouseMove}
        @mousedown=${this._handleMouseDown}
        @mouseup=${this._handleMouseUp}
        @contextmenu=${this._handleContextmenu}
      ></canvas>
    `;
  }

  protected render(): unknown {
    if (document.querySelector("#elementTimelineCanvasRef")) {
      this.timelineState.setCanvasWidth(
        document.querySelector("#elementTimelineCanvasRef").clientWidth,
      );
    }

    return html` ${this.renderCanvas()}`;
  }
}
