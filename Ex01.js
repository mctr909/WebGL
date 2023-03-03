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
let tAttLocation = [];
/** @type{Array<number>} */
let tAttStride = [];
/** @type{Array<WebGLUniformLocation>} */
let tUniLocation = [];

/** @type{WebGLProgram} */
let prg_main;
/** @type{Array<number>} */
let attLocation = [];
/** @type{Array<number>} */
let attStride = [];
/** @type{Array<WebGLUniformLocation>} */
let uniLocation = [];

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
    tAttLocation[0] = 0;
    tAttLocation[1] = 1;
    tAttLocation[2] = 2;
    tAttStride[0] = 3;
    tAttStride[1] = 3;
    tAttStride[2] = 4;
    tUniLocation[0] = gl.getUniformLocation(prg_t, 'time');
    tUniLocation[1] = gl.getUniformLocation(prg_t, 'mouse');
    tUniLocation[2] = gl.getUniformLocation(prg_t, 'move');

    // feedback in shader
    vs = create_shader("vs_main");
    fs = create_shader("fs_main");
    prg_main = create_program(vs, fs);
    attLocation[0] = 0;
    attLocation[1] = 1;
    attLocation[2] = 2;
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;
    uniLocation[0] = gl.getUniformLocation(prg_main, 'vpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg_main, 'move');

    // flags
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
    gl.disable(gl.RASTERIZER_DISCARD);
}

/*** set value ***/
let vpMatrix = new Mat();
/** @type{Array<Array<WebGLBuffer>>} */
let VBOArray;
{
    let vMatrix = new Mat();
    let pMatrix = new Mat();
    vMatrix.lookAt([0.0, 0.0, 3.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    pMatrix.perspective(60, 0.1, 10.0, canvasWidth / canvasHeight);
    Mat.multiply(pMatrix, vMatrix, vpMatrix);

    let position = [];
    let velocity = [];
    let color = [];
    for(let i = 0; i < imageHeight; ++i){
        let y = i / imageHeight * 2.0 - 1.0;
        let k = i * imageWidth;
        for(let j = 0; j < imageWidth; ++j){
            let x = j / imageWidth * 2.0 - 1.0;
            let m = Math.sqrt(x * x + y * y);
            let l = (k + j) * 4;
            position.push(x, -y, 0.0);
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
}

/*** set event ***/
let isMousedown = false;
let mousePosition = [0.0, 0.0];
let mouseMovePower = 0.0;
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

let vbo_in = 1;
var vbo_out = 0;
let startTime = Date.now();
render();
function render() {
    vbo_in = ++vbo_in % 2;
    vbo_out = 1 - vbo_in;

    let nowTime = (Date.now() - startTime) / 1000;

    // mouse move power
    if (isMousedown !== true) {
        mouseMovePower *= 1 - 1/60;
    }

    // transform program
    {
        gl.useProgram(prg_t);

        // set vbo
        set_attribute(VBOArray[vbo_in], tAttLocation, tAttStride);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, VBOArray[vbo_out][0]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, VBOArray[vbo_out][1]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, VBOArray[vbo_out][2]);

        // begin transform feedback
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);

        // vertex transform
        gl.uniform1f(tUniLocation[0], nowTime);
        gl.uniform2fv(tUniLocation[1], mousePosition);
        gl.uniform1f(tUniLocation[2], mouseMovePower);
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
        set_attribute(VBOArray[vbo_out], attLocation, attStride);

        // push and render
        gl.uniformMatrix4fv(uniLocation[0], false, vpMatrix.Array);
        gl.uniform1f(uniLocation[1], mouseMovePower);
        gl.drawArrays(gl.POINTS, 0, imageWidth * imageHeight);

        gl.flush();
    }

    requestAnimationFrame(render);
}
