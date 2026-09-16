const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock DOM Environment
const listeners = {};

const dummyFunc = () => {};
const canvasContextMock = new Proxy({
    measureText: () => ({ width: 100 })
}, {
    get: (target, prop) => {
        if (prop in target) return target[prop];
        return dummyFunc;
    }
});

const mockElements = {
    imageInput: { addEventListener: () => {}, value: "" },
    imageStatus: { textContent: "" },
    canvas: { getContext: () => canvasContextMock, width: 1080, height: 1080 },
    textInput: { value: "", addEventListener: () => {} },
    textLength: { textContent: "" },
    fontSize: { value: "60", addEventListener: () => {} },
    fontSizeValue: { textContent: "" },
    textColor: { value: "#222222", addEventListener: () => {} },
    textColorValue: { textContent: "" },
    textX: { value: "50", addEventListener: () => {} },
    textXValue: { textContent: "" },
    textY: { value: "50", addEventListener: () => {} },
    textYValue: { textContent: "" },
    downloadButton: { addEventListener: () => {} },
    templateName: { value: "" },
    saveTemplateButton: { addEventListener: (type, cb) => { listeners['saveTemplate'] = cb; } },
    templateList: { innerHTML: "", appendChild: () => {}, removeAttribute: () => {}, setAttribute: () => {} },
    templateStatus: { textContent: "" },
    exportJsonButton: { addEventListener: () => {} },
    jsonInput: { value: "", addEventListener: () => {} },
    jsonStatus: { textContent: "" },
    templateEditArea: { hidden: true },
    editTemplateName: { value: "", focus: () => {} },
    confirmEditTemplateButton: { addEventListener: (type, cb) => { listeners['confirmEditTemplate'] = cb; } },
    cancelEditTemplateButton: { addEventListener: () => {} }
};

const documentMock = {
    getElementById: (id) => {
        if (mockElements[id]) return mockElements[id];
        return { addEventListener: () => {}, value: "", textContent: "" };
    },
    querySelectorAll: (selector) => {
        return [];
    },
    createElement: (tag) => {
        return {
            type: "",
            textContent: "",
            className: "",
            addEventListener: () => {},
            appendChild: () => {},
            removeAttribute: () => {},
            setAttribute: () => {}
        };
    }
};

let storage = {};
const localStorageMock = {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = val; },
    clear: () => { storage = {}; }
};

const windowMock = {
    localStorage: localStorageMock
};

class ImageMock {}

const sandbox = {
    document: documentMock,
    window: windowMock,
    localStorage: localStorageMock,
    Image: ImageMock,
    console: console,
    setTimeout: setTimeout,
    setInterval: setInterval,
    editingTemplateId: null,
    currentImage: null,
    currentRatio: "1:1",
    STORAGE_KEY: "image-card-editor-templates",
    Date: Date,
    JSON: JSON,
    URL: { createObjectURL: () => "", revokeObjectURL: () => "" },
    confirm: () => true
};

vm.createContext(sandbox);

// Read script.js content
const scriptCode = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// Run script.js in sandbox
vm.runInContext(scriptCode, sandbox);

// Extract references to the callback functions
const onSaveTemplate = listeners['saveTemplate'];
const onConfirmEdit = listeners['confirmEditTemplate'];

if (!onSaveTemplate) {
    console.error("Failed to extract saveTemplate listener!");
    process.exit(1);
}
if (!onConfirmEdit) {
    console.error("Failed to extract confirmEditTemplate listener!");
    process.exit(1);
}

// Custom showStatus spy to check what message is shown
let lastStatusMsg = "";
sandbox.showStatus = (el, msg) => {
    lastStatusMsg = msg;
    el.textContent = msg;
};

// Helper to get saved templates
function getSavedTemplates() {
    const val = localStorageMock.getItem("image-card-editor-templates");
    return val ? JSON.parse(val) : [];
}

// Helper to clean storage
function resetState() {
    localStorageMock.clear();
    // Re-evaluate script to reset its local variable
    vm.runInContext(scriptCode, sandbox);
    mockElements.templateName.value = "";
    mockElements.editTemplateName.value = "";
    sandbox.editingTemplateId = null;
    lastStatusMsg = "";
}

// Running Tests T01 to T10
console.log("=== Running T01 to T10 tests ===");

// T01
// 입력: 템플릿이 없는 상태에서 이름 "여행" 저장
// 기대값: 템플릿 1개가 저장된다.
resetState();
mockElements.templateName.value = "여행";
onSaveTemplate();
let saved = getSavedTemplates();
const t01_success = saved.length === 1 && saved[0].name === "여행";
console.log(`T01: ${t01_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T02
// 입력: "여행"이 존재하는 상태에서 이름 "여행" 저장
// 기대값: 새 템플릿이 저장되지 않고 중복 안내가 표시된다.
mockElements.templateName.value = "여행";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t02_success = saved.length === 1 && lastStatusMsg.includes("존재하는");
console.log(`T02: ${t02_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T03
// 입력: "맛집" 저장
// 기대값: "맛집" 템플릿이 저장된다.
mockElements.templateName.value = "맛집";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t03_success = saved.length === 2 && saved.some(t => t.name === "맛집");
console.log(`T03: ${t03_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T04
// 입력: "맛집"이 존재하는 상태에서 이름 " 맛집 " 저장
// 기대값: 새 템플릿이 저장되지 않고 중복 안내가 표시된다.
mockElements.templateName.value = " 맛집 ";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t04_success = saved.length === 2 && lastStatusMsg.includes("존재하는");
console.log(`T04: ${t04_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T05
// 입력: 이름에 공백만 입력하여 저장
// 기대값: 저장되지 않고 이름 입력 오류 안내가 표시된다.
mockElements.templateName.value = "   ";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t05_success = saved.length === 2 && lastStatusMsg.includes("이름");
console.log(`T05: ${t05_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T06
// 입력: "여행", "맛집"이 존재하는 상태에서 "운동" 저장
// 기대값: "운동"이 저장되고 총 3개가 된다.
mockElements.templateName.value = "운동";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t06_success = saved.length === 3 && saved.some(t => t.name === "운동");
console.log(`T06: ${t06_success ? "PASS" : "FAIL"} (Templates length: ${saved.length}, msg: ${lastStatusMsg})`);

// T07
// 입력: 기존 "여행" 템플릿을 편집하여 이름을 "맛집"으로 변경
// 기대값: 변경되지 않고 중복 안내가 표시된다.
// (templates: "여행", "맛집", "운동")
let travelTemplate = saved.find(t => t.name === "여행");
sandbox.editingTemplateId = travelTemplate.id;
mockElements.editTemplateName.value = "맛집";
lastStatusMsg = "";
onConfirmEdit();
// After confirm edit, the state inside script.js local variable might have been updated.
// Let's reload saved templates to see if Travel changed.
saved = getSavedTemplates();
travelTemplate = saved.find(t => t.id === travelTemplate.id);
const t07_success = travelTemplate.name === "여행" && lastStatusMsg.includes("존재하는");
console.log(`T07: ${t07_success ? "PASS" : "FAIL"} (Travel name: ${travelTemplate.name}, msg: ${lastStatusMsg})`);

// T08
// 입력: 기존 "여행" 템플릿을 편집하면서 이름을 그대로 "여행"으로 유지
// 기대값: 정상적으로 편집 내용이 저장된다.
mockElements.editTemplateName.value = "여행";
lastStatusMsg = "";
onConfirmEdit();
saved = getSavedTemplates();
travelTemplate = saved.find(t => t.id === travelTemplate.id);
const t08_success = travelTemplate.name === "여행" && lastStatusMsg.includes("수정되었습니다");
console.log(`T08: ${t08_success ? "PASS" : "FAIL"} (Travel name: ${travelTemplate.name}, msg: ${lastStatusMsg})`);

// T09
// 입력: 기존 "여행" 템플릿을 편집하여 이름을 " 여행 "으로 변경
// 기대값: 변경되지 않고 중복 안내가 표시된다.
mockElements.editTemplateName.value = " 여행 ";
lastStatusMsg = "";
onConfirmEdit();
saved = getSavedTemplates();
travelTemplate = saved.find(t => t.id === travelTemplate.id);
const t09_success = travelTemplate.name === "여행" && lastStatusMsg.includes("존재하는");
console.log(`T09: ${t09_success ? "PASS" : "FAIL"} (Travel name: ${travelTemplate.name}, msg: ${lastStatusMsg})`);

// T10
// 입력: "Travel"이 존재하는 상태에서 "travel" 저장
// 기대값: "travel"이 새 템플릿으로 저장된다.
resetState();
mockElements.templateName.value = "Travel";
onSaveTemplate();
mockElements.templateName.value = "travel";
lastStatusMsg = "";
onSaveTemplate();
saved = getSavedTemplates();
const t10_success = saved.length === 2 && saved.some(t => t.name === "travel");
console.log(`T10: ${t10_success ? "PASS" : "FAIL"} (Templates: ${saved.map(t => t.name).join(', ')}, msg: ${lastStatusMsg})`);

const allPassed = t01_success && t02_success && t03_success && t04_success && t05_success && t06_success && t07_success && t08_success && t09_success && t10_success;
if (allPassed) {
    console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
    process.exit(0);
} else {
    console.error("\n>>> SOME TESTS FAILED! <<<");
    process.exit(1);
}
