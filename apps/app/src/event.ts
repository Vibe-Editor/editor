import { rendererModal } from "./utils/modal";
import { loadedAssetStore } from "./features/asset/loadedAssetStore";
import { useTimelineStore } from "./states/timelineStore";

window.electronAPI.res.render.progressing((evt, prog) => {
  rendererModal.progressModal.show();
  document.querySelector("#progress").style.width = `${prog}%`;
  document.querySelector("#progress").innerHTML = `${Math.round(prog)}%`;
});

window.electronAPI.res.render.finish((evt) => {
  rendererModal.progressModal.hide();
  rendererModal.progressFinish.show();

  document.querySelector("#progress").style.width = `100%`;
  document.querySelector("#progress").innerHTML = `100%`;

  const projectFolder = document.querySelector("#projectFolder").value;

  window.electronAPI.req.filesystem.emptyDirSync(
    `${projectFolder}/renderAnimation`,
  );
  window.electronAPI.req.filesystem.removeDirectory(
    `${projectFolder}/renderAnimation`,
  );
});

window.electronAPI.res.render.error((evt, errormsg) => {
  rendererModal.progressModal.hide();
  rendererModal.progressError.show();

  document.querySelector("#progressErrorMsg").innerHTML = `${errormsg}`;
});

window.electronAPI.res.app.forceClose((evt) => {
  let isTimelineChange = document
    .querySelector("element-timeline")
    .isTimelineChange();
  if (isTimelineChange == true) {
    rendererModal.whenClose.show();
  } else {
    window.electronAPI.req.app.forceClose();
  }
});

window.electronAPI.res.shortcut.controlS((evt) => {
  NUGGET.project.save();
});

window.electronAPI.res.shortcut.controlO((evt) => {
  NUGGET.project.load();
});

window.electronAPI.res.timeline.get((event) => {
  let timeline = _.cloneDeep(
    document.querySelector("element-timeline").timeline,
  );

  event.sender.send("return:timeline:get", timeline);
});

window.electronAPI.res.timeline.add(async (event, timeline) => {
  console.log("[Renderer] timeline:add", Object.keys(timeline));
  for (const timelineId in timeline) {
    if (Object.hasOwnProperty.call(timeline, timelineId)) {
      const element = timeline[timelineId];
      const elementTimeline = document.querySelector("element-timeline");

      Object.assign(elementTimeline.timeline, timeline);
      await elementTimeline.patchElementInTimeline({
        elementId: timelineId,
        element: element,
      });
    }
  }

  // Move play-head to the very start so freshly-added clips are visible in the
  // preview.  This avoids confusion when the user’s cursor was parked beyond
  // the new content (e.g. after a previous editing session).
  const timelineStore = useTimelineStore.getState();
  const preview = document.querySelector("preview-canvas");

  if (timelineStore.cursor !== 0) {
    timelineStore.setCursor(0);
    // Because we changed the cursor we need to refresh asset loading & redraw
    const { timeline } = timelineStore;
    const newCursor = 0;
    await loadedAssetStore.getState().loadAssetsNeededAtTime(newCursor, timeline);
    await loadedAssetStore.getState().seek(timeline, newCursor);
    if (preview) preview.drawCanvas(preview.canvas);
  }

  // Ensure preview canvas shows first frames immediately
  if (preview) {
    const { cursor, timeline } = useTimelineStore.getState();
    await loadedAssetStore.getState().loadAssetsNeededAtTime(cursor, timeline);
    await loadedAssetStore.getState().seek(timeline, cursor);
    // Force immediate draw so first frame appears
    preview.drawCanvas(preview.canvas);
  }
});

window.addEventListener("load", (event) => {
  let toastElList = [].slice.call(document.querySelectorAll(".toast"));
  toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl);
  });
});

window.onresize = async function (event) {
  const elementControlComponent = document.querySelector("element-control");

  await elementControlComponent.resizeEvent();
};

// HTMLCanvasElement.prototype.render = function () {
//     nugget.canvas.preview.render(this);
//   };

//   HTMLCanvasElement.prototype.clear = function () {
//     nugget.canvas.preview.clear(this);
//   };
