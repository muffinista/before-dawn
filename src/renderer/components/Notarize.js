
const NOTARIZE_DEFAULTS = {
  wrapperClass: "notarize-wrapper",
  interiorClass: "notarize",
  timeout: 150000,
  transitionIn: "notarize-in",
  transitionOut: "notarize-out",
  template: (args) => { return `<div class='${args.wrapperClass}'><div class='${args.interiorClass}'>${args.contents}</div></div>`; }
};

export default class Notarize {
  constructor(options={}) {
    this.options = Object.assign({}, NOTARIZE_DEFAULTS, options);
    return this;
  }

  show(contents) {
    const body = document.querySelector("body");
    const guts = this.options.template({
      wrapperClass: [this.options.wrapperClass, this.options.transitionIn].join(" "),
      interiorClass: this.options.interiorClass,
      contents: contents
    });
    const el = this.toDom(guts);
    body.insertBefore(el, body.firstChild);

    el.addEventListener("animationend", this.handleTransitionIn.bind(this));       
  }

  toDom(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim(); // Never return a text node of whitespace as the result

    if (template.content) {
      return template.content.firstChild;
    }

    return template.firstChild;
  }

  handleTransitionIn(ev) {
    const el = ev.target;
    el.removeEventListener("animationend", this.handleTransitionIn);

    setTimeout(() => {
      el.addEventListener("animationend", this.handleTransitionOut.bind(this));
      el.classList.add(this.options.transitionOut);
    }, this.options.timeout);
  }

  handleTransitionOut(ev) {
    ev.target.removeEventListener("animationend", this.handleTransitionOut);
    ev.target.parentNode.removeChild(ev.target);
  }
}
