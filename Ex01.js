/// <reference path="script/render.js"/>

const canvasWidth = 512;
const canvasHeight = 512;
const imageWidth = 256;
const imageHeight = 256;

// canvas要素のWebGLコンテキストを取得
let elmScreen = document.getElementById("screen");
/** @type{WebGL2RenderingContext} */
gl = elmScreen.getContext("webgl2");

/** @type{WebGLProgram} */
let prg_t;
/** @type{Array<number>} */
let attLocation = [];
/** @type{Array<number>} */
let attStride = [];
/** @type{Array<WebGLUniformLocation>} */
let uniLocation = [];

/** @type{WebGLProgram} */
let prg_main;
/** @type{Array<number>} */
let fAttLocation = [];
/** @type{Array<number>} */
let fAttStride = [];
/** @type{Array<WebGLUniformLocation>} */
let fUniLocation = [];

/*** init shader ***/
{
    // Transform Feedback オブジェクトを生成
    let transformFeedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    // transform out shader
    let vs = create_shader("vs_transform");
    let fs = create_shader("fs_transform");
    let outVaryings = ['vPosition', 'vVelocity', 'vColor'];
    prg_t = create_program_tf_separate(vs, fs, outVaryings);
    attLocation[0] = 0;
    attLocation[1] = 1;
    attLocation[2] = 2;
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;
    uniLocation[0] = gl.getUniformLocation(prg_t, 'time');
    uniLocation[1] = gl.getUniformLocation(prg_t, 'mouse');
    uniLocation[2] = gl.getUniformLocation(prg_t, 'move');

    // feedback in shader
    vs = create_shader("vs_main");
    fs = create_shader("fs_main");
    prg_main = create_program(vs, fs);
    fAttLocation[0] = 0;
    fAttLocation[1] = 1;
    fAttLocation[2] = 2;
    fAttStride[0] = 3;
    fAttStride[1] = 3;
    fAttStride[2] = 4;
    fUniLocation[0] = gl.getUniformLocation(prg_main, 'vpMatrix');
    fUniLocation[1] = gl.getUniformLocation(prg_main, 'move');

    // flags
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
    gl.disable(gl.RASTERIZER_DISCARD);
}

let VBOArray;
let vpMatrix = new Mat();
let run = true;
let isMousedown = false;
let count = 0;
let nowTime = 0;
let startTime = Date.now();
let mousePosition = [0.0, 0.0];
let mouseMovePower = 0.0;

/*** set value ***/
{
    let i, j, k, l, m;
    let x, y;
    let position = [];
    let velocity = [];
    let color = [];
    for(i = 0; i < imageHeight; ++i){
        y = i / imageHeight * 2.0 - 1.0;
        k = i * imageWidth;
        for(j = 0; j < imageWidth; ++j){
            x = j / imageWidth * 2.0 - 1.0;
            l = (k + j) * 4;
            position.push(x, -y, 0.0);
            m = Math.sqrt(x * x + y * y);
            velocity.push(x / m, -y / m, 0.0);
            color.push(
                255 / 255,
                191 / 255,
                191 / 255,
                191 / 255
            );
        }
    }
    VBOArray = [
        [
            create_vbo(position),
            create_vbo(velocity),
            create_vbo(color)
        ], [
            create_vbo(position),
            create_vbo(velocity),
            create_vbo(color)
        ]
    ];

    let vMatrix = new Mat();
    let pMatrix = new Mat();
    vMatrix.lookAt([0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    pMatrix.perspective(60, 0.1, 10.0, canvasWidth / canvasHeight);
    Mat.multiply(pMatrix, vMatrix, vpMatrix);
}

/*** set event ***/
{
    // mousemove event
    elmScreen.addEventListener('mousedown', function(eve) {
        isMousedown = true;
        mouseMovePower = 1.0;
    }, false);
    elmScreen.addEventListener('mouseup', function(eve) {
        isMousedown = false;
    }, false);
    elmScreen.addEventListener('mousemove', function(eve) {
        let bound = eve.currentTarget.getBoundingClientRect();
        let x = eve.clientX - bound.left;
        let y = eve.clientY - bound.top;
        mousePosition = [
            x / bound.width * 2.0 - 1.0,
            -(y / bound.height * 2.0 - 1.0)
        ];
    }, false);
}

render();
function render() {
    var countIndex = (++count) % 2;
    var invertIndex = 1 - countIndex;

    nowTime = (Date.now() - startTime) / 1000;

    // mouse move power
    if(isMousedown !== true){
        mouseMovePower *= 0.95;
    }

    // transform program
    {
        gl.useProgram(prg_t);

        // set vbo
        set_attribute(VBOArray[countIndex], attLocation, attStride);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, VBOArray[invertIndex][0]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, VBOArray[invertIndex][1]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, VBOArray[invertIndex][2]);

        // begin transform feedback
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);

        // vertex transform
        gl.uniform1f(uniLocation[0], nowTime);
        gl.uniform2fv(uniLocation[1], mousePosition);
        gl.uniform1f(uniLocation[2], mouseMovePower);
        gl.drawArrays(gl.POINTS, 0, imageWidth * imageHeight);

        // end transform feedback
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);

        // clear
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, canvasWidth, canvasHeight);
    }

    // feedback program
    {
        gl.useProgram(prg_main);

        // set vbo
        set_attribute(VBOArray[invertIndex], fAttLocation, fAttStride);

        // push and render
        gl.uniformMatrix4fv(fUniLocation[0], false, vpMatrix.Array);
        gl.uniform1f(fUniLocation[1], mouseMovePower);
        gl.drawArrays(gl.POINTS, 0, imageWidth * imageHeight);

        gl.flush();
    }

    if (run) {
        requestAnimationFrame(render);
    }
}
