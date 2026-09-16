const imageInput = document.getElementById("imageInput");
const imageStatus = document.getElementById("imageStatus");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const textInput = document.getElementById("textInput");
const textLength = document.getElementById("textLength");

const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");

const textColor = document.getElementById("textColor");
const textColorValue = document.getElementById("textColorValue");

const textX = document.getElementById("textX");
const textXValue = document.getElementById("textXValue");

const textY = document.getElementById("textY");
const textYValue = document.getElementById("textYValue");

const downloadButton =
    document.getElementById("downloadButton");

const ratioButtons =
    document.querySelectorAll(".ratio-button");

const templateName =
    document.getElementById("templateName");

const saveTemplateButton =
    document.getElementById("saveTemplateButton");

const templateList =
    document.getElementById("templateList");

const templateStatus =
    document.getElementById("templateStatus");

const exportJsonButton =
    document.getElementById("exportJsonButton");

const jsonInput =
    document.getElementById("jsonInput");

const jsonStatus =
    document.getElementById("jsonStatus");

const templateEditArea =
    document.getElementById("templateEditArea");

const editTemplateName =
    document.getElementById("editTemplateName");

const confirmEditTemplateButton =
    document.getElementById("confirmEditTemplateButton");

const cancelEditTemplateButton =
    document.getElementById("cancelEditTemplateButton");    


let editingTemplateId = null;
let currentImage = null;
let currentRatio = "1:1";

const STORAGE_KEY = "image-card-editor-templates";

let templates = loadTemplates();


/* =========================
   캔버스 크기
========================= */

function setCanvasSize() {

    if (currentRatio === "1:1") {
        canvas.width = 1080;
        canvas.height = 1080;
    }

    if (currentRatio === "4:5") {
        canvas.width = 1080;
        canvas.height = 1350;
    }

    if (currentRatio === "9:16") {
        canvas.width = 1080;
        canvas.height = 1920;
    }
}


/* =========================
   이미지 업로드
========================= */

imageInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) {
        return;
    }


    /*
        실제 MIME 타입 검사.

        잘못된 파일이면 기존 이미지와
        기존 편집 상태를 그대로 유지한다.
    */

    if (
        file.type !== "image/png" &&
        file.type !== "image/jpeg"
    ) {

        showStatus(
            imageStatus,
            "PNG 또는 JPEG 이미지만 사용할 수 있습니다."
        );

        imageInput.value = "";

        return;
    }


    const image = new Image();

    const objectUrl =
        URL.createObjectURL(file);


    image.onload = () => {

        currentImage = image;

        setCanvasSize();

        draw();

        URL.revokeObjectURL(objectUrl);

        showStatus(
            imageStatus,
            "이미지를 불러왔습니다."
        );
    };


    image.onerror = () => {

        URL.revokeObjectURL(objectUrl);

        showStatus(
            imageStatus,
            "이미지를 불러오지 못했습니다."
        );

        imageInput.value = "";
    };


    image.src = objectUrl;
});


/* =========================
   캔버스 다시 그리기
========================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (!currentImage) {
        return;
    }


    /*
        원본 이미지 비율을 유지하면서
        캔버스 안에 전체가 들어오도록 한다.
    */

    const imageWidth =
        currentImage.width;

    const imageHeight =
        currentImage.height;

    const imageRatio =
        imageWidth / imageHeight;

    const canvasRatio =
        canvas.width / canvas.height;


    let drawWidth;
    let drawHeight;


    if (imageRatio > canvasRatio) {

        drawWidth = canvas.width;

        drawHeight =
            drawWidth / imageRatio;

    } else {

        drawHeight = canvas.height;

        drawWidth =
            drawHeight * imageRatio;
    }


    const drawX =
        (canvas.width - drawWidth) / 2;

    const drawY =
        (canvas.height - drawHeight) / 2;


    ctx.drawImage(
        currentImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );


    const text =
        textInput.value;


    if (!text) {
        return;
    }


    drawText(text);
}


/* =========================
   텍스트
========================= */

function drawText(text) {

    const size =
        Number(fontSize.value);

    const x =
        canvas.width *
        (Number(textX.value) / 100);

    const y =
        canvas.height *
        (Number(textY.value) / 100);


    ctx.font =
        `bold ${size}px Arial, "Noto Sans KR", "Noto Sans", sans-serif`;

    ctx.fillStyle =
        textColor.value;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    /*
        줄바꿈을 지원한다.

        한 줄이 너무 길 경우
        자동으로 적당한 폭에서 줄을 나눈다.
    */

    const maxWidth =
        canvas.width * 0.9;

    const lines =
        makeTextLines(text, maxWidth);


    const lineHeight =
        size * 1.25;

    const totalHeight =
        lines.length * lineHeight;

    let startY =
        y - (totalHeight - lineHeight) / 2;


    lines.forEach((line) => {

        ctx.fillText(
            line,
            x,
            startY
        );

        startY += lineHeight;
    });
}


/* =========================
   텍스트 줄바꿈
========================= */

function makeTextLines(text, maxWidth) {

    const sourceLines =
        text.split(/\r?\n/);

    const result = [];


    sourceLines.forEach((sourceLine) => {

        if (sourceLine.length === 0) {

            result.push("");

            return;
        }


        let current = "";


        for (const character of sourceLine) {

            const test =
                current + character;

            if (
                ctx.measureText(test).width >
                    maxWidth &&
                current.length > 0
            ) {

                result.push(current);

                current = character;

            } else {

                current = test;
            }
        }


        if (current.length > 0) {
            result.push(current);
        }
    });


    return result;
}


/* =========================
   비율 변경
========================= */

ratioButtons.forEach((button) => {

    button.addEventListener("click", () => {

        currentRatio =
            button.dataset.ratio;


        ratioButtons.forEach((item) => {
            item.classList.remove("active");
        });

        button.classList.add("active");


        setCanvasSize();

        draw();
    });
});


/* =========================
   텍스트 입력
========================= */

textInput.addEventListener(
    "input",
    () => {

        updateControlValues();

        draw();
    }
);


/* =========================
   컨트롤
========================= */

fontSize.addEventListener(
    "input",
    () => {

        updateControlValues();

        draw();
    }
);


textColor.addEventListener(
    "input",
    () => {

        updateControlValues();

        draw();
    }
);


textX.addEventListener(
    "input",
    () => {

        updateControlValues();

        draw();
    }
);


textY.addEventListener(
    "input",
    () => {

        updateControlValues();

        draw();
    }
);


/* =========================
   값 표시
========================= */

function updateControlValues() {

    fontSizeValue.textContent =
        `${fontSize.value}px`;

    textColorValue.textContent =
        textColor.value.toUpperCase();

    textXValue.textContent =
        `${textX.value}%`;

    textYValue.textContent =
        `${textY.value}%`;

    textLength.textContent =
        `${textInput.value.length} / 500`;
}


/* =========================
   현재 편집 상태
========================= */

function getCurrentTemplateData() {

    return {
        ratio: currentRatio,

        text: textInput.value,

        fontSize: Number(fontSize.value),

        textColor: textColor.value,

        textX: Number(textX.value),

        textY: Number(textY.value)
    };
}


/* =========================
   템플릿 데이터 적용
========================= */

function applyTemplateData(data) {

    if (!validateTemplateData(data)) {
        return false;
    }


    currentRatio =
        data.ratio;

    textInput.value =
        data.text;

    fontSize.value =
        data.fontSize;

    textColor.value =
        data.textColor;

    textX.value =
        data.textX;

    textY.value =
        data.textY;


    ratioButtons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.ratio === currentRatio
        );
    });


    setCanvasSize();

    updateControlValues();

    draw();

    return true;
}


/* =========================
   템플릿 생성
========================= */

saveTemplateButton.addEventListener(
    "click",
    () => {

        const name =
            templateName.value.trim();


        if (!name) {

            showStatus(
                templateStatus,
                "템플릿 이름을 입력해주세요."
            );

            return;
        }


        const isDuplicate = templates.some(
            (t) => t.name.trim() === name
        );

        if (isDuplicate) {

            showStatus(
                templateStatus,
                "이미 존재하는 템플릿 이름입니다."
            );

            return;
        }


        const template = {

            id: createId(),

            name,

            data:
                getCurrentTemplateData(),

            createdAt:
                new Date().toISOString()
        };


        templates.push(template);

        saveTemplates();

        renderTemplates();

        templateName.value = "";


        showStatus(
            templateStatus,
            "템플릿이 저장되었습니다."
        );
    }
);


/* =========================
   템플릿 목록
========================= */

function renderTemplates() {

    templateList.innerHTML = "";


    if (templates.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "template-empty";

        empty.textContent =
            "저장된 템플릿이 없습니다.";

        templateList.appendChild(empty);

        return;
    }


    templates.forEach((template) => {

        const item =
            document.createElement("div");

        item.className =
            "template-item";


        const name =
            document.createElement("div");

        name.className =
            "template-name";

        name.textContent =
            template.name;


        const actions =
            document.createElement("div");

        actions.className =
            "template-actions";


        const loadButton =
            document.createElement("button");

        loadButton.type =
            "button";

        loadButton.textContent =
            "불러오기";


        loadButton.addEventListener(
            "click",
            () => {

                if (
                    applyTemplateData(
                        template.data
                    )
                ) {

                    showStatus(
                        templateStatus,
                        `"${template.name}" 템플릿을 불러왔습니다.`
                    );
                }
            }
        );


        const editButton =
            document.createElement("button");

        editButton.type =
            "button";

        editButton.textContent =
            "수정";


        editButton.addEventListener(
            "click",
            () => {

                editingTemplateId =
                    template.id;

                editTemplateName.value =
                    template.name;

                templateEditArea.hidden =
                    false;

                editTemplateName.focus();
            }
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.textContent =
            "삭제";


        deleteButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    confirm(
                        `"${template.name}" 템플릿을 삭제할까요?`
                    );


                if (!confirmed) {
                    return;
                }


                templates =
                    templates.filter(
                        (item) =>
                            item.id !== template.id
                    );


                saveTemplates();

                renderTemplates();


                showStatus(
                    templateStatus,
                    "템플릿이 삭제되었습니다."
                );
            }
        );


        actions.appendChild(loadButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        item.appendChild(name);
        item.appendChild(actions);


        templateList.appendChild(item);
    });
}

confirmEditTemplateButton.addEventListener(
    "click",
    () => {

        if (!editingTemplateId) {
            return;
        }

        const trimmed =
            editTemplateName.value.trim();

        if (!trimmed) {

            showStatus(
                templateStatus,
                "템플릿 이름은 비워둘 수 없습니다."
            );

            return;
        }

        const target =
            templates.find(
                (item) =>
                    item.id === editingTemplateId
            );

        if (!target) {
            return;
        }


        if (editTemplateName.value !== target.name) {

            const isDuplicate = templates.some(
                (t) => t.name.trim() === trimmed
            );

            if (isDuplicate) {

                showStatus(
                    templateStatus,
                    "이미 존재하는 템플릿 이름입니다."
                );

                return;
            }
        }


        target.name =
            trimmed;

        target.data =
            getCurrentTemplateData();

        saveTemplates();

        renderTemplates();

        templateEditArea.hidden =
            true;

        editingTemplateId =
            null;

        showStatus(
            templateStatus,
            "템플릿이 수정되었습니다."
        );
    }
);


cancelEditTemplateButton.addEventListener(
    "click",
    () => {

        templateEditArea.hidden =
            true;

        editingTemplateId =
            null;
    }
);


/* =========================
   템플릿 저장
========================= */

function saveTemplates() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(templates)
    );
}


/* =========================
   템플릿 불러오기
========================= */

function loadTemplates() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!raw) {
            return [];
        }


        const parsed =
            JSON.parse(raw);


        if (!Array.isArray(parsed)) {
            return [];
        }


        return parsed.filter(
            (template) =>
                validateTemplate(template)
        );

    } catch (error) {

        return [];
    }
}


/* =========================
   템플릿 검증
========================= */

function validateTemplate(template) {

    if (
        !template ||
        typeof template !== "object"
    ) {
        return false;
    }


    if (
        typeof template.id !== "string" ||
        typeof template.name !== "string"
    ) {
        return false;
    }


    return validateTemplateData(
        template.data
    );
}


function validateTemplateData(data) {

    if (
        !data ||
        typeof data !== "object"
    ) {
        return false;
    }


    const validRatios = [
        "1:1",
        "4:5",
        "9:16"
    ];


    if (
        !validRatios.includes(data.ratio)
    ) {
        return false;
    }


    if (
        typeof data.text !== "string"
    ) {
        return false;
    }


    if (
        typeof data.fontSize !== "number" ||
        data.fontSize < 20 ||
        data.fontSize > 200
    ) {
        return false;
    }


    if (
        typeof data.textColor !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(
            data.textColor
        )
    ) {
        return false;
    }


    if (
        typeof data.textX !== "number" ||
        data.textX < 0 ||
        data.textX > 100
    ) {
        return false;
    }


    if (
        typeof data.textY !== "number" ||
        data.textY < 0 ||
        data.textY > 100
    ) {
        return false;
    }


    return true;
}


/* =========================
   JSON 내보내기
========================= */

exportJsonButton.addEventListener(
    "click",
    () => {

        if (templates.length === 0) {

            showStatus(
                jsonStatus,
                "내보낼 템플릿이 없습니다."
            );

            return;
        }


        const json =
            JSON.stringify(
                templates,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type: "application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "card-templates.json";

        link.click();


        URL.revokeObjectURL(url);


        showStatus(
            jsonStatus,
            "템플릿 JSON을 내보냈습니다."
        );
    }
);


/* =========================
   JSON 가져오기
========================= */

jsonInput.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        try {

            /*
                파일 전체를 먼저 읽고
                모든 검증을 끝낸 뒤에만
                기존 템플릿을 변경한다.
            */

            const text =
                await file.text();


            let parsed;


            try {

                parsed =
                    JSON.parse(text);

            } catch (error) {

                throw new Error(
                    "JSON 문법이 올바르지 않습니다."
                );
            }


            if (!Array.isArray(parsed)) {

                throw new Error(
                    "JSON 최상위 값은 배열이어야 합니다."
                );
            }


            const valid =
                parsed.every(
                    (template) =>
                        validateTemplate(template)
                );


            if (!valid) {

                throw new Error(
                    "필수 항목이 없거나 올바르지 않은 템플릿이 포함되어 있습니다."
                );
            }


            /*
                검증 성공 후에만 적용한다.
            */

            templates =
                parsed.map(
                    (template) => ({
                        id: template.id,
                        name: template.name,
                        data: {
                            ...template.data
                        },
                        createdAt:
                            template.createdAt ||
                            new Date().toISOString()
                    })
                );


            saveTemplates();

            renderTemplates();


            showStatus(
                jsonStatus,
                `${templates.length}개의 템플릿을 복원했습니다.`
            );

        } catch (error) {

            /*
                오류가 발생해도
                기존 templates는 건드리지 않는다.
            */

            showStatus(
                jsonStatus,
                `가져오기 실패: ${error.message}`
            );

        } finally {

            jsonInput.value = "";
        }
    }
);


/* =========================
   카드 다운로드
========================= */

downloadButton.addEventListener(
    "click",
    () => {

        if (!currentImage) {

            alert(
                "먼저 이미지를 선택해주세요."
            );

            return;
        }


        /*
            다운로드 직전에 완성본을
            한 번만 다시 그린다.
        */

        draw();


        canvas.toBlob(
            (blob) => {

                if (!blob) {

                    alert(
                        "이미지를 저장하지 못했습니다."
                    );

                    return;
                }


                const url =
                    URL.createObjectURL(blob);


                const link =
                    document.createElement("a");


                link.download =
                    "card.png";

                link.href =
                    url;


                link.click();


                URL.revokeObjectURL(url);
            },
            "image/png"
        );
    }
);


/* =========================
   유틸리티
========================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function showStatus(element, message) {

    element.textContent =
        message;
}


/* =========================
   초기화
========================= */

setCanvasSize();

updateControlValues();

renderTemplates();

draw();