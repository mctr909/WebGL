/** @type{HTMLCanvasElement} */
let screen_elm = document.getElementById("screen");

// canvas要素のWebGLコンテキストを取得
/** @type{WebGLRenderingContext} */
let gl_context = screen_elm.getContext("experimental-webgl");

// シェーダーのコンパイルとattribute変数を取得
/** @type{number} */
let locVPos;
/** @type{number} */
let locPPos;
{
    // バーテックス／フラグメントシェーダーを作成
    let vshader = gl_context.createShader(gl_context.VERTEX_SHADER);
    let fshader = gl_context.createShader(gl_context.FRAGMENT_SHADER);

    // バーテックス／フラグメントシェーダーにソースコードを設定
    /** @type{HTMLScriptElement} */
    let elmVS = document.getElementById('vs-code');
    /** @type{HTMLScriptElement} */
    let elmFS = document.getElementById('fs-code');
    gl_context.shaderSource(vshader, elmVS.text);
    gl_context.shaderSource(fshader, elmFS.text);

    // バーテックスシェーダー／フラグメントシェーダーのソースをコンパイル
    gl_context.compileShader(vshader);
    gl_context.compileShader(fshader);

    // programオブジェクトを作成
    let gl_program = gl_context.createProgram();

    // programオブジェクトのシェーダーを設定
    gl_context.attachShader(gl_program, vshader);
    gl_context.attachShader(gl_program, fshader);

    // シェーダーを設定したprogramをリンクし、割り当て
    gl_context.linkProgram(gl_program);
    gl_context.useProgram(gl_program);

    // attribute変数を取得
    locVPos = gl_context.getAttribLocation(gl_program, 'vPos');
    locPPos = gl_context.getAttribLocation(gl_program, 'pPos');

    // attribute vPos/pPosを有効化
    gl_context.enableVertexAttribArray(locVPos);
    gl_context.enableVertexAttribArray(locPPos);
}

{
    // バッファ作成
    let vbuf = gl_context.createBuffer();
    let pbuf = gl_context.createBuffer();

    // vPos用バッファをバインドしてデータ領域を初期化・頂点データを転送する
    let vlist = new Float32Array(new Array(
        -1.0, -1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0
    ));
    gl_context.bindBuffer(gl_context.ARRAY_BUFFER, vbuf);
    gl_context.bufferData(gl_context.ARRAY_BUFFER, vlist, gl_context.STATIC_DRAW);

    // pPos用バッファをバインドしてデータ領域を初期化しデータを転送
    let plist = new Float32Array(new Array(
        -1.5, -1.0,
        -1.5, 1.0,
        0.5, -1.0,
        0.5, 1.0
    ));
    gl_context.bindBuffer(gl_context.ARRAY_BUFFER, pbuf);
    gl_context.bufferData(gl_context.ARRAY_BUFFER, plist, gl_context.STATIC_DRAW);

    // データを書き込んだバッファをvPos/pPosのデータとして設定
    gl_context.vertexAttribPointer(locVPos, 2, gl_context.FLOAT, false, 0, 0);
    gl_context.vertexAttribPointer(locPPos, 2, gl_context.FLOAT, false, 0, 0);
}

// 描画領域全体を覆う正方形を描画
gl_context.drawArrays(gl_context.TRIANGLE_STRIP, 0, 4);
