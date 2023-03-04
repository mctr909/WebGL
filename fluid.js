/** @type{WebGL2RenderingContext} */
let gl;

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
let UNILOC_SMPL;

/** @type{WebGLTexture} */
let TEX_0;
/** @type{WebGLTexture} */
let TEX_1;

/** @type{WebGLFramebuffer} */
let FBO_0;
/** @type{WebGLFramebuffer} */
let FBO_1;

const DATA_SIZE = 1024;
let animation = "";
let timer;
let time;
let it = 10;
let interval = 0;
let frames = 0;

function getShader(id) {
    let shaderScript = document.getElementById(id);
    let str = "";
    let k = shaderScript.firstChild;
    while(k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    let shader;
    if ( shaderScript.type == "x-shader/x-fragment" ) {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if ( shaderScript.type == "x-shader/x-vertex" ) {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0) {
        alert(id + "\n" + gl.getShaderInfoLog(shader));
    }
    return shader;
}

function getProgram(vs_id, fs_id) {
    let prg = gl.createProgram();
    gl.attachShader(prg, getShader(vs_id));
    gl.attachShader(prg, getShader(fs_id));
    gl.linkProgram(prg);
    return prg;
}

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
                        T = .005;
                    } else if (y>0.3 && y<0.4) {
                        T = -.005;
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
        let c = document.getElementById(elm_id);
        if (!window.WebGLRenderingContext) {
            alert(err + "WebGL.");
            return;
        }

        try {
            gl = c.getContext("experimental-webgl");
            //gl = c.getContext("webgl2");
        } catch(e) {}
        if (!gl) {
            alert("Can't get WebGL");
            return;
        }

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
        PROG_SOURCE = getProgram("shader-vs", "Source-fs");
        PROG_FORCE = getProgram("shader-vs", "force-fs");
        PROG_VELO = getProgram("shader-vs", "velocity-fs");
        PROG_PRES = getProgram("shader-vs", "pressure-fs");
        PROG_DIV = getProgram("shader-vs", "div-fs");
        PROG_SHOW = getProgram("shader-vs", "shader-fs-show");

        gl.useProgram(PROG_SOURCE);
        gl.uniform1i(gl.getUniformLocation(PROG_SOURCE, "smpl2"), 2);
        
        gl.useProgram(PROG_FORCE);
        gl.uniform1f(gl.getUniformLocation(PROG_FORCE, "c"), .001*.5*10);
        gl.uniform1i(gl.getUniformLocation(PROG_FORCE, "smpl"), 1);

        gl.useProgram(PROG_VELO);
        let aPosLoc = gl.getAttribLocation(PROG_VELO, "aPos");
        let aTexLoc = gl.getAttribLocation(PROG_VELO, "aTexCoord");
        gl.enableVertexAttribArray(aPosLoc);
        gl.enableVertexAttribArray(aTexLoc);
        let data = new Float32Array([
            -1,-1, 0,0,
            1,-1, 1,0,
            -1,1, 0,1,
            1,1, 1,1
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, gl.FALSE, 16, 0);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, gl.FALSE, 16, 8);

        gl.useProgram(PROG_PRES);
        UNILOC_SMPL = gl.getUniformLocation(PROG_PRES, "smpl");

        gl.useProgram(PROG_DIV);
        gl.uniform1i(gl.getUniformLocation(PROG_DIV, "smpl"), 1);
    }

    {
        let pixels = createData(true);
        let texture2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, DATA_SIZE, DATA_SIZE, 0, gl.RGBA, gl.FLOAT, new Float32Array(pixels));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
        gl.uniform1i(UNILOC_SMPL, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
        gl.uniform1i(UNILOC_SMPL, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_0);
    gl.useProgram(PROG_DIV);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
 
    gl.useProgram(PROG_SHOW);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
