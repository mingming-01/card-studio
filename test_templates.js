const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptCode = fs.readFileSync(path.join(__dirname, "script.js"), "utf8");
const STORAGE_KEY = "image-card-editor-templates";

function createTestApp() {
    const listeners = {};
    const createdElements = [];
    const dummyFunc = () => {};
    const canvasContext = new Proxy(
        { measureText: () => ({ width: 100 }) },
        { get: (target, property) => target[property] || dummyFunc }
    );

    function createElement() {
        const element = {
            children: [], className: "", hidden: false, textContent: "", type: "",
            addEventListener(type, callback) {
                this.listeners = this.listeners || {};
                this.listeners[type] = callback;
            },
            appendChild(child) { this.children.push(child); },
            removeAttribute: dummyFunc, setAttribute: dummyFunc
        };
        createdElements.push(element);
        return element;
    }

    const elements = {
        imageInput: { addEventListener: dummyFunc, value: "" },
        imageStatus: { textContent: "" },
        canvas: { getContext: () => canvasContext, height: 1080, width: 1080 },
        textInput: { addEventListener: dummyFunc, value: "" }, textLength: { textContent: "" },
        fontSize: { addEventListener: dummyFunc, value: "60" }, fontSizeValue: { textContent: "" },
        textColor: { addEventListener: dummyFunc, value: "#222222" }, textColorValue: { textContent: "" },
        textX: { addEventListener: dummyFunc, value: "50" }, textXValue: { textContent: "" },
        textY: { addEventListener: dummyFunc, value: "50" }, textYValue: { textContent: "" },
        downloadButton: { addEventListener: dummyFunc }, templateName: { value: "" },
        saveTemplateButton: { addEventListener: (type, callback) => { listeners.save = callback; } },
        templateList: { children: [], innerHTML: "", appendChild(child) { this.children.push(child); } },
        templateStatus: { textContent: "" }, exportJsonButton: { addEventListener: dummyFunc },
        jsonInput: { addEventListener: dummyFunc, value: "" }, jsonStatus: { textContent: "" },
        templateEditArea: { hidden: true }, editTemplateName: { focus: dummyFunc, value: "" },
        confirmEditTemplateButton: { addEventListener: (type, callback) => { listeners.confirmEdit = callback; } },
        cancelEditTemplateButton: { addEventListener: dummyFunc }
    };
    const storage = {};
    const localStorage = {
        getItem: (key) => storage[key] || null,
        setItem: (key, value) => { storage[key] = value; }
    };
    const sandbox = {
        Image: class {}, URL: { createObjectURL: () => "", revokeObjectURL: dummyFunc },
        confirm: () => true, console,
        document: {
            createElement,
            getElementById: (id) => elements[id] || { addEventListener: dummyFunc },
            querySelectorAll: () => []
        },
        localStorage, setInterval, setTimeout, window: { localStorage }
    };

    vm.createContext(sandbox);
    vm.runInContext(scriptCode, sandbox);

    return {
        save(name) {
            elements.templateName.value = name;
            elements.templateStatus.textContent = "";
            listeners.save();
        },
        edit(nextName) {
            const editButton = createdElements.find((element) =>
                element.textContent === "수정" && element.listeners && element.listeners.click
            );
            if (!editButton) throw new Error("Could not find the template edit button");
            editButton.listeners.click();
            elements.editTemplateName.value = nextName;
            elements.templateStatus.textContent = "";
            listeners.confirmEdit();
        },
        saved: () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
        status: () => elements.templateStatus.textContent
    };
}

function report(id, passed, detail) {
    console.log(`${id}: ${passed ? "PASS" : "FAIL"} (${detail})`);
    return passed;
}

console.log("=== Running fixed T01 to T10 tests ===");
const app = createTestApp();
const results = [];

// T01: 템플릿이 없는 상태에서 이름 "여행" 저장 → 템플릿 1개가 저장된다.
app.save("여행");
results.push(report("T01", app.saved().length === 1 && app.saved()[0].name === "여행", `templates: ${app.saved().length}, message: ${app.status()}`));

// T02: "여행"이 존재하는 상태에서 이름 "여행" 저장 → 저장되지 않고 중복 안내.
app.save("여행");
results.push(report("T02", app.saved().length === 1 && app.status().includes("존재하는"), `templates: ${app.saved().length}, message: ${app.status()}`));

// T03: "맛집" 저장 → "맛집" 템플릿이 저장된다.
app.save("맛집");
results.push(report("T03", app.saved().length === 2 && app.saved().some((t) => t.name === "맛집"), `templates: ${app.saved().length}, message: ${app.status()}`));

// T04: "맛집"이 존재하는 상태에서 이름 " 맛집 " 저장 → 저장되지 않고 중복 안내.
app.save(" 맛집 ");
results.push(report("T04", app.saved().length === 2 && app.status().includes("존재하는"), `templates: ${app.saved().length}, message: ${app.status()}`));

// T05: 이름에 공백만 입력하여 저장 → 저장되지 않고 이름 입력 오류 안내.
app.save("   ");
results.push(report("T05", app.saved().length === 2 && app.status().includes("이름"), `templates: ${app.saved().length}, message: ${app.status()}`));

// T06: "여행", "맛집"이 존재하는 상태에서 "운동" 저장 → 총 3개.
app.save("운동");
results.push(report("T06", app.saved().length === 3 && app.saved().some((t) => t.name === "운동"), `templates: ${app.saved().length}, message: ${app.status()}`));

// T07: 기존 "여행"을 "맛집"으로 편집 → 변경되지 않고 중복 안내.
app.edit("맛집");
results.push(report("T07", app.saved().some((t) => t.name === "여행") && app.status().includes("존재하는"), `templates: ${app.saved().map((t) => t.name).join(", ")}, message: ${app.status()}`));

// T08: 기존 "여행"을 그대로 유지하며 편집 → 정상 저장.
app.edit("여행");
results.push(report("T08", app.saved().some((t) => t.name === "여행") && app.status().includes("수정되었습니다"), `templates: ${app.saved().map((t) => t.name).join(", ")}, message: ${app.status()}`));

// T09: 기존 "여행"을 " 여행 "으로 변경 → 변경되지 않고 중복 안내.
app.edit(" 여행 ");
results.push(report("T09", app.saved().some((t) => t.name === "여행") && app.status().includes("존재하는"), `templates: ${app.saved().map((t) => t.name).join(", ")}, message: ${app.status()}`));

// T10: "Travel"이 있을 때 "travel" 저장 → 새 템플릿으로 저장된다.
const caseSensitiveApp = createTestApp();
caseSensitiveApp.save("Travel");
caseSensitiveApp.save("travel");
results.push(report("T10", caseSensitiveApp.saved().length === 2 && caseSensitiveApp.saved().some((t) => t.name === "travel"), `templates: ${caseSensitiveApp.saved().map((t) => t.name).join(", ")}, message: ${caseSensitiveApp.status()}`));

if (results.every(Boolean)) {
    console.log("\n>>> ALL FIXED TESTS PASSED SUCCESSFULLY! <<<");
} else {
    console.error("\n>>> SOME FIXED TESTS FAILED! <<<");
    process.exitCode = 1;
}
