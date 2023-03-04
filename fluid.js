/// <reference path="script/render.js"/>

/** @type{WebGLProgram} */
let PROG_SOURCE;
/** @type{WebGLProgram} */
let PROG_FORCE;
/** @type{WebGLProgram} */
let PROG_VELO;
/** @type{WebGLProgram} */
let PROG_PRES;
/** @type{WebGLProgram} */
let PROG_DIV;
/** @type{WebGLProgram} */
let PROG_SHOW;

/** @type{WebGLUniformLocation} */
let UNILOC_FIELD;

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

function createData(isInit=false) {
    let ret = [];
    if (isInit) {
        for(let py = 0; py<DATA_SIZE; py++) {
            let y = py * 2 / DATA_SIZE - 1;
            for(let px = 0; px<DATA_SIZE; px++) {
                let x = px * 2 / DATA_SIZE - 1;
                let T = 0;
                if (x>-0.2 && x<0.2) {
                    if (y>-0.4 && y<-0.3) {
                        T = .01;
                    } else if (y>0.3 && y<0.4) {
                        T = -.01;
                    }
                }
                ret.push(0, 0, T, 0);
            }
        }
    } else {
        for(let py = 0; py<DATA_SIZE; py++) {
            let y = py * 2 / DATA_SIZE - 1;
            for(let px = 0; px<DATA_SIZE; px++) {
                let x = px * 2 / DATA_SIZE - 1;
                let T = 0;
                if (y>-0.1 && y<0.1) {
                    if (x>-0.3 && x<-0.05) {
                        T = 1;
                    } else if (x>0.05 && x<0.3) {
                        T = -1;
                    }
                }
                ret.push(0, 0, T, 0);
            }
        }
    }
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
        DATA_SIZE = elm.clientWidth;
        let ext;
        try {
            ext = gl.getExtension("OES_texture_float");
        } catch(e) {}
        if (!ext) {
            alert(err + "OES_texture_float extension");
            return;
        }
    }

    {
        let vs = create_shader("shader-vs");
        PROG_SOURCE = create_program(vs, create_shader("source-fs"));
        PROG_FORCE = create_program(vs, create_shader("force-fs"));
        PROG_VELO = create_program(vs, create_shader("velocity-fs"));
        PROG_PRES = create_program(vs, create_shader("pressure-fs"));
        PROG_DIV = create_program(vs, create_shader("div-fs"));
        PROG_SHOW = create_program(vs, create_shader("shader-fs-show"));

        gl.useProgram(PROG_SOURCE);
        gl.uniform1i(gl.getUniformLocation(PROG_SOURCE, "field_input"), 2);

        gl.useProgram(PROG_FORCE);
        gl.uniform1i(gl.getUniformLocation(PROG_FORCE, "field"), 1);
        gl.uniform1f(gl.getUniformLocation(PROG_FORCE, "c"), .001*.5*10);

        gl.useProgram(PROG_VELO);
        let attLocPos = gl.getAttribLocation(PROG_VELO, "aPos");
        let attLocTex = gl.getAttribLocation(PROG_VELO, "aTexCoord");
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

        gl.useProgram(PROG_PRES);
        UNILOC_FIELD = gl.getUniformLocation(PROG_PRES, "field", 0);

        gl.useProgram(PROG_DIV);
        gl.uniform1i(gl.getUniformLocation(PROG_DIV, "field"), 1);
    }

    {
        let pixels = createData();

        TEX_0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TEX_0);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        TEX_1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, TEX_1);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        pixels = createData(true);
        let tex_2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tex_2);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
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

    timer = setInterval(fr, 500);
    time = new Date().getTime();
    animation = "animate";
    anim();
}

function draw() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
    gl.useProgram(PROG_SOURCE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
    gl.useProgram(PROG_FORCE);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
    gl.useProgram(PROG_VELO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.useProgram(PROG_PRES);
    for(var i = 0; i < it; i++) {
        gl.uniform1i(UNILOC_FIELD, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
        gl.uniform1i(UNILOC_FIELD, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
    gl.useProgram(PROG_DIV);
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.bindTexture(gl.TEXTURE_2D, TEX_1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
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
