import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";
import { LocaleController } from "../../controllers/locale";
import "../../components/input/input";

@customElement("control-ui-setting")
export class ControlSetting extends LitElement {
  private lc = new LocaleController(this);

  @property()
  renderOptionStore: IRenderOptionStore = renderOptionStore.getInitialState();

  @property()
  renderOption = this.renderOptionStore.options;

  @property()
  appVersion = "";

  createRenderRoot() {
    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
    });

    window.electronAPI.req.app.getAppInfo().then((result) => {
              this.appVersion = `Usuals.ai v${result.data.version}`;
    });

    return this;
  }

  _handleUpdateBackgroundColor(e) {
    this.renderOption.backgroundColor = e.target.value;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleUpdatePreviewSizeW(e) {
    this.renderOption.previewSize.w = e.target.value;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleUpdatePreviewSizeH(e) {
    this.renderOption.previewSize.h = e.target.value;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleUpdateDurationSecond(e) {
    const minute = parseInt(
      document.querySelector("#projectDurationMinute").value,
    );
    const second = parseInt(e.target.value);

    this.renderOption.duration = minute * 60 + second;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleUpdateDurationMinute(e) {
    const minute = parseInt(e.target.value);
    const second = parseInt(
      document.querySelector("#projectDurationSecond").value,
    );

    this.renderOption.duration = minute * 60 + second;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleClickChangeLang() {
    if (this.lc.value == "ko") {
      this.lc.changeLanguage("en");
    } else {
      this.lc.changeLanguage("ko");
    }
  }

  _handleClickResolution(w, h) {
    this.renderOption.previewSize.w = w;
    this.renderOption.previewSize.h = h;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleAspectRatioChange(e) {
    const value = e.target.value;
    this.renderOption.aspectRatio = value;
    const [wRatioStr, hRatioStr] = value.split(":");
    const wRatio = parseInt(wRatioStr || "16");
    const hRatio = parseInt(hRatioStr || "9");
    const currentW = this.renderOption.previewSize.w;
    const newH = Math.round((currentW * hRatio) / wRatio);
    this.renderOption.previewSize.h = newH;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  render() {
    return html` <p class="text-secondary" ref="appVersion">
        ${this.appVersion}
      </p>

      <input id="projectFile" type="text" class="d-none" name="" />

      <div class="input-group mb-3">
        <input
          id="projectFolder"
          type="text"
          class="form-control bg-default text-light"
          placeholder="/"
          disabled
        />
        <button
          class="btn btn-sm btn-default text-light"
          onclick="NUGGET.directory.select()"
        >
          ${this.lc.t("setting.select_project_folder")}
        </button>
      </div>

      <label class="form-label text-light">Aspect Ratio</label>
      <div class="input-group mb-3">
        <select class="form-select bg-default text-light" @change=${this._handleAspectRatioChange}>
          <option value="16:9" ${this.renderOption.aspectRatio === "16:9" ? "selected" : ""}>16:9 (Widescreen)</option>
          <option value="4:3" ${this.renderOption.aspectRatio === "4:3" ? "selected" : ""}>4:3</option>
          <option value="1:1" ${this.renderOption.aspectRatio === "1:1" ? "selected" : ""}>1:1 (Square)</option>
          <option value="9:16" ${this.renderOption.aspectRatio === "9:16" ? "selected" : ""}>9:16 (Vertical)</option>
          <option value="21:9" ${this.renderOption.aspectRatio === "21:9" ? "selected" : ""}>21:9 (Ultrawide)</option>
        </select>
      </div>

      <label class="form-label text-light"
        >${this.lc.t("setting.video_duration")}</label
      >
      <div class="d-flex flex-row bd-highlight gap-2">
        <div class="input-group mb-3">
          <input
            id="projectDurationMinute"
            type="number"
            class="form-control bg-default text-light"
            placeholder="m"
            @change=${this._handleUpdateDurationMinute}
            value="0"
            min="0"
          />
          <span class="input-group-text bg-default text-light" id="basic-addon2"
            >${this.lc.t("setting.minute_unit")}</span
          >
        </div>

        <div class="input-group mb-3">
          <input
            id="projectDurationSecond"
            type="number"
            class="form-control bg-default text-light"
            placeholder="${this.lc.t("setting.seconds")} e.g) 0"
            @change=${this._handleUpdateDurationSecond}
            value="10"
            min="0"
          />
          <span class="input-group-text bg-default text-light" id="basic-addon2"
            >${this.lc.t("setting.seconds_unit")}</span
          >
        </div>
      </div>

      <label class="form-label text-light">${this.lc.t("setting.frame")}</label>
      <div class="input-group mb-3">
        <input
          id="projectDuration"
          type="number"
          class="form-control bg-default text-light"
          placeholder=""
          value="60"
          disabled
        />
        <span class="input-group-text bg-default text-light" id="basic-addon2"
          >fps</span
        >
      </div>

      <!-- <label class="form-label text-light">Background</label>
      <div class="input-group mb-3">
        <input
          id="backgroundColor"
          type="color"
          class="form-control bg-default text-light"
          value=${this.renderOption.backgroundColor}
          @change=${this._handleUpdateBackgroundColor}
          @input=${this._handleUpdateBackgroundColor}
        />
      </div>

      <label class="form-label text-light"
        >${this.lc.t("setting.resolution")}</label
      >
      <div class="d-flex flex-row bd-highlight mb-2">
        <input
          id="previewSizeH"
          type="number"
          class="form-control bg-default text-light me-1"
          value=${this.renderOption.previewSize.h}
          @change=${this._handleUpdatePreviewSizeH}
        />
        <input
          id="previewSizeW"
          type="number"
          class="form-control bg-default text-light"
          value=${this.renderOption.previewSize.w}
          @change=${this._handleUpdatePreviewSizeW}
        />
      </div>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        @click=${() => this._handleClickResolution(1920, 1080)}
      >
        1920x1080 (desktop)
      </button>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        @click=${() => this._handleClickResolution(3840, 2160)}
      >
        3840x2160 (4k)
      </button>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        @click=${() => this._handleClickResolution(1080, 1080)}
      >
        1080x1080 (square)
      </button>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        @click=${() => this._handleClickResolution(1080, 1920)}
      >
        1080x1920 (mobile)
      </button> -->

      <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="NUGGET.project.save()"
      >
        ${this.lc.t("setting.save_project")}
      </button>
      <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="NUGGET.project.load()"
      >
        ${this.lc.t("setting.load_project")}
      </button>

      <!-- <button class="btn btn-sm bg-primary text-light mt-1" onclick="window.electronAPI.req.progressBar.test()">PROGRESSBARTEST </button> -->
      <br />

      <button
        type="button"
        class="btn btn-sm btn-default text-light mt-1"
        data-bs-toggle="modal"
        data-bs-target="#shortKey"
      >
        <span class="material-symbols-outlined"> keyboard </span>
      </button>

      <button
        type="button"
        class="btn btn-sm btn-default text-light mt-1"
        data-bs-toggle="modal"
        data-bs-target="#changeLang"
      >
        <span class="material-symbols-outlined"> language </span>
      </button>

      <br />`;
  }
}
