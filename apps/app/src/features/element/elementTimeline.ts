import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { provide } from "@lit/context";
import { timelineContext } from "../../context/timelineContext";

// NOTE: 조만간 deprecated
@customElement("element-timeline")
export class ElementTimeline extends LitElement {
  elementControl: any;
  timelineHashTable: {};
  copyedTimelineData: {};
  editGuideBreakPoint: any[];

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
    });

    return this;
  }

  constructor() {
    super();

    //this.directory = ''
    this.elementControl;

    this.addEventListener("scroll", this.handleScroll.bind(this));

    window.addEventListener("DOMContentLoaded", () => {
      this.elementControl = document.querySelector("element-control");
    });

    this.timelineHashTable = {};
    this.appendCheckpointInHashTable();
    this.copyedTimelineData = {};

    // NOTE: edit guide == 정렬 가이드, 모든 엘리먼트의 시작점과 끝 점을 담은 배열입니다.
    this.editGuideBreakPoint = [];
  }

  generateHash(text) {
    let hash = 0,
      i,
      chr;
    if (text.length === 0) return hash;
    for (i = 0; i < text.length; i++) {
      chr = text.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return hash;
  }

  getTime() {
    return Date.now();
  }

  appendCheckpointInHashTable() {
    // NOTE: 해시 테이블에 변경점 입력
    let hashString = JSON.stringify(this.timeline);
    let hash = this.generateHash(hashString);
    let nowTimestamp = this.getTime();
    this.timelineHashTable[nowTimestamp] = hash;
  }

  isTimelineChange() {
    let nowHashString = JSON.stringify(this.timeline);
    let nowTimelineHash = this.generateHash(nowHashString);
    let timelineHashLength = Object.keys(this.timelineHashTable).length;
    let firstKeyInTimelineHashTable = Object.keys(this.timelineHashTable)[
      timelineHashLength - 1
    ];
    let prevTimelineHash = this.timelineHashTable[firstKeyInTimelineHashTable];
    return nowTimelineHash != prevTimelineHash;
  }

  replaceTimelineBarHeight(height) {
    let timelineBar: any = this.querySelector(".timeline-bar");
    timelineBar.style.height = `${height}px`;
  }

  getTimelineScrollHeight() {
    return this.scrollHeight;
  }

  async patchTimeline(timeline) {
    this.timeline = timeline;
    this.elementControl.timeline = timeline;

    for (const elementId in timeline) {
      if (Object.hasOwnProperty.call(timeline, elementId)) {
        const element = timeline[elementId];
        await this.patchElementInTimeline({
          elementId: elementId,
          element: element,
        });
      }
    }
  }

  async patchElementInTimeline({ elementId, element }) {
    // If opacity animation accidentally set to active with zero value from external sources, reset.
    if (
      element.animation &&
      "opacity" in element.animation &&
      (element.animation.opacity?.isActivate ?? false)
    ) {
      element.animation.opacity.isActivate = false;
      element.animation.opacity.x = [];
      element.animation.opacity.ax = [[], []];
    }
    // Likewise ensure element.opacity is 100
    if (element.opacity == null || element.opacity < 100) {
      element.opacity = 100;
    }

    if (element.filetype == "image") {
      const encodedPath = encodeURI(element.localpath);
      let blobUrl = await this.getBlobUrl(`file://${encodedPath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showImage(elementId);
    } else if (element.filetype == "video") {
      const encodedPath = encodeURI(element.localpath);
      let blobUrl = await this.getBlobUrl(`file://${encodedPath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showVideo(elementId);
      // Ensure video elements that just became available are made visible immediately
      this.elementControl.appearAllElementInTime();
    } else if (element.filetype == "text") {
      document.querySelector("select-font").applyFontStyle({
        fontName: element.fontname,
        fontPath: element.fontpath,
        fontType: element.fonttype,
      });

      this.elementControl.showText(elementId);
    } else if (element.filetype == "audio") {
      const encodedPath = encodeURI(element.localpath);
      let blobUrl = await this.getBlobUrl(`file://${encodedPath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showAudio(elementId);
    }

    // NEW: propagate timeline change to the global store so dependent components redraw
    // This ensures timeline bars become visible after elements are injected from the extension.
    this.timelineState.patchTimeline(this.timeline);
  }

  async getBlobUrl(url) {
    try {
      const response = await fetch(url);
      const data = await response.blob();
      return URL.createObjectURL(data);
    } catch (error) {
      let notfoundImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAAM0lEQVQ4jWNkYGD4z4AEUDgMDAyMBASYGCgEowaMGjA4DGD8/x8j+dPXBSzka/1PHRcAAFzYCBvm7NkTAAAAAElFTkSuQmCC`;

      console.error(error);
      const response = await fetch(notfoundImage);
      const data = await response.blob();
      return URL.createObjectURL(data);
    }
  }

  fixRulerOnTop() {
    const scrollTop = this.scrollTop;
    const elementTimelineRuler = document.querySelector(
      "element-timeline-ruler",
    );
    const elementTimelineCursor = document.querySelector(
      "element-timeline-cursor",
    );

    elementTimelineRuler.setTopPosition(scrollTop);
    elementTimelineCursor.style.top = `${scrollTop}px`;
  }

  handleScroll() {
    const scrollDom: any = this.querySelector("element-timeline-scroll");
    this.fixRulerOnTop();
    scrollDom.setScrollThumbLeft({
      px: this.scrollLeft,
    });
  }

  @provide({ context: timelineContext })
  @property()
  public timelineOptions = {
    canvasVerticalScroll: 0,
    panelOptions: [],
  };

  render() {
    this.classList.add(
      "col-12",
      "cursor-default",
      "h-100",
      "line",
      "bg-darker",
      "overflow-y-auto",
    );

    return html`
      <element-timeline-cursor></element-timeline-cursor>

      <element-timeline-left-option></element-timeline-left-option>
      <element-timeline-canvas></element-timeline-canvas>
    `;
  }
}
