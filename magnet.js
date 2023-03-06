/// <reference path="script/render.js"/>

/** @type{WebGLProgram} */
let PROG_SOURCE;
/** @type{WebGLProgram} */
let PROG_FORCE;
/** @type{WebGLProgram} */
let PROG_SHOW;

/** @type{WebGLUniformLocation} */
let UNILOC_FIELD;
/** @type{WebGLUniformLocation} */
let UNILOC_ROT;
/** @type{WebGLUniformLocation} */
let UNILOC_R_SCALE;

/** @type{WebGLTexture} */
let TEX_0;
/** @type{WebGLTexture} */
let TEX_1;

/** @type{WebGLFramebuffer} */
let FBO_0;
/** @type{WebGLFramebuffer} */
let FBO_1;

let animation = "";
let timer;
let time;
let it = 10;
let interval = 0;
let frames = 0;
let r_scale = 1;

function createData() {
    let ret = [];
    for(let py = 0; py<GRID_SIZE; py++) {
        for(let px = 0; px<GRID_SIZE; px++) {
            ret.push(0, 0, 0, 0);
        }
    }
    return ret;
}

function cleateMagnet() {
    const POLES = 8;
    const P = -1;
    const RADIUS = 0.3;
    const DIV = POLES/256.0;

    let ret = [];
    DATA_SIZE = 0;

    for(let p=0; p<POLES; p++) {
        for(let d=0; d<1/4; d+=DIV) {
            let a = p + d - 1/2;
            let b = p + d + 1/4;
            let ac = Math.cos(2*Math.PI*a/POLES);
            let as = Math.sin(2*Math.PI*a/POLES);
            let bc = Math.cos(2*Math.PI*b/POLES);
            let bs = Math.sin(2*Math.PI*b/POLES);
            let ax = ac*RADIUS;
            let ay = as*RADIUS;
            let bx = bc*RADIUS;
            let by = bs*RADIUS;
            if (p%2==0) {
                ret.push(ax, ay, -P*as, P*ac);
                ret.push(bx, by, P*bs, -P*bc);
            } else {
                ret.push(ax, ay, P*as, -P*ac);
                ret.push(bx, by, -P*bs, P*bc);
            }
            DATA_SIZE += 2;
        }
        for(let d=-1/4; d<1/4; d+=DIV) {
            let a = p + d;
            let c = Math.cos(2*Math.PI*a/POLES);
            let s = Math.sin(2*Math.PI*a/POLES);
            let x = c*RADIUS;
            let y = s*RADIUS;
            if (p%2==0) {
                ret.push(x, y, c, s);
            } else {
                ret.push(x, y, -c, -s);
            }
            DATA_SIZE++;
        }
    }
    let radix2_len = Math.pow(2, parseInt(Math.log2(DATA_SIZE)+0.99));
    let dummy_len = radix2_len - DATA_SIZE;
    for(let i=0; i<dummy_len; i++) {
        ret.push(0, 0, 0, 0);
    }
    DATA_SIZE = radix2_len;
    return ret;
}

function onLoad(elm_id) {
    const err = "Your browser does not support ";
    {
        if (!window.WebGLRenderingContext) {
            alert(err + "WebGL.");
            return;
        }
        let elm = document.getElementById(elm_id);
        try {
            gl = elm.getContext("experimental-webgl");
            //gl = c.getContext("webgl2");
        } catch(e) {}
        if (!gl) {
            alert("Can't get WebGL");
            return;
        }
        GRID_SIZE = elm.clientWidth;
        let ext;
        try {
            ext = gl.getExtension("OES_texture_float");
        } catch(e) {}
        if (!ext) {
            alert(err + "OES_texture_float extension");
            return;
        }
    }

    let magnet = cleateMagnet();

    {
        let vs = create_shader("shader-vs");
        PROG_SOURCE = create_program(vs, create_shader("source-fs"));
        PROG_FORCE = create_program(vs, create_shader("force-fs"));
        PROG_SHOW = create_program(vs, create_shader("shader-fs-show"));

        gl.useProgram(PROG_SOURCE);
        gl.uniform1i(gl.getUniformLocation(PROG_SOURCE, "field_input"), 2);
        UNILOC_ROT = gl.getUniformLocation(PROG_SOURCE, "rot");
        UNILOC_R_SCALE = gl.getUniformLocation(PROG_SOURCE, "r_scale");
        gl.uniformMatrix2fv(UNILOC_ROT, false, [1,0,0,1]);
        gl.uniform1f(UNILOC_R_SCALE, GRID_SIZE/8);

        gl.useProgram(PROG_FORCE);
        gl.uniform1i(gl.getUniformLocation(PROG_FORCE, "field"), 1);
        gl.uniform1f(gl.getUniformLocation(PROG_FORCE, "c"), .001*.5*10);
        let attLocPos = gl.getAttribLocation(PROG_FORCE, "aPos");
        let attLocTex = gl.getAttribLocation(PROG_FORCE, "aTexCoord");
        gl.enableVertexAttribArray(attLocPos);
        gl.enableVertexAttribArray(attLocTex);
        let data = new Float32Array([
            -1,-1, 0,0,
            1,-1, 1,0,
            -1,1, 0,1,
            1,1, 1,1
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(attLocPos, 2, gl.FLOAT, gl.FALSE, 16, 0);
        gl.vertexAttribPointer(attLocTex, 2, gl.FLOAT, gl.FALSE, 16, 8);
    }

    {
        let pixels = createData();

        TEX_0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TEX_0);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_SIZE, GRID_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        TEX_1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, TEX_1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_SIZE, GRID_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        let tex_2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex_2);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(magnet));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    {
        FBO_0 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, TEX_0, 0);

        FBO_1 = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, TEX_1, 0);

        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            alert(err + "FLOAT as the color attachment to an FBO");
        }
    }

    r_scale = GRID_SIZE/document.getElementById("r_scale").value;
    document.getElementById("r_scale").oninput = function() {
        r_scale = GRID_SIZE/this.value;
    };

    timer = setInterval(fr, 500);
    time = new Date().getTime();
    animation = "animate";
    anim();
}

let th = 2*Math.PI*33.33/3600;
let rot_x = Math.cos(th);
let rot_y = Math.sin(th);
let c = 1.0;
let s = 0.0;
function draw() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
    gl.useProgram(PROG_SOURCE);
    gl.uniformMatrix2fv(UNILOC_ROT, false, [c,-s,s,c]);
    gl.uniform1f(UNILOC_R_SCALE, r_scale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    let tmp = c*rot_x - s*rot_y;
    s = s*rot_x + c*rot_y;
    c = tmp;

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
    gl.useProgram(PROG_FORCE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(PROG_SHOW);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frames++;
}

function anim() {
    draw();
    switch(animation) {
    case "reset":
        let pixels = createData();
        gl.bindTexture(gl.TEXTURE_2D, TEX_0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_SIZE, GRID_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.bindTexture(gl.TEXTURE_2D, TEX_1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_SIZE, GRID_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        animation = "animate";
    case "animate":
        if (interval == 0) {
            requestAnimationFrame(anim);
        } else {
            setTimeout("requestAnimationFrame(anim)", interval);
        }
        break;
    case "stop":
        break;
    }
}

/**
 * @param {*} c dt*b/2
 */
function setBu(c) {
    var bu = c.valueOf();
    gl.useProgram(PROG_FORCE); 
    gl.uniform1f(gl.getUniformLocation(PROG_FORCE, "c"), .001*.5*bu);
}

function run(v) {
    if(animation == "animate"){
        animation = "stop";
        document.getElementById('runBtn').value = "Run ";
    } else {
        animation = "animate";
        document.getElementById('runBtn').value = "Stop";
        anim();
    }
}
function reset() {
    if(animation == "stop"){
        animation = "reset";
        document.getElementById('runBtn').value = "Stop";
        anim();
    } else {
        animation = "reset";
    }
}
function fr() {
    var ti = new Date().getTime();
    var fps = Math.round(1000*frames/(ti - time));
    document.getElementById("framerate").innerHTML = fps;
    frames = 0;
    time = ti;
}
function setDelay(val) {
    interval = parseInt(val);
}
function setIt(val) {
    it = parseInt(val);
}
