/// <reference path="struct.js"/>
/// <reference path="queue.js"/>
class ShaderAttribute {
    /**
     * @param {WebGLRenderingContext} gl
     * @param {WebGLProgram} program
     * @param {number} type
     * @param {number} size
     * @param {string} name
     */
    constructor(gl, program, type, size, name) {
        this._gl = gl;
        this._location = gl.getAttribLocation(program, name);
        this._type = type;
        this._size = size;
        this._name = name;
    }
    get Name() { return this._name; }
    /**
     * バッファをバインドする
     * @param {WebGLBuffer} vbo
     */
    bindBuffer(vbo) {
        // バッファをバインドする
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
        // attributeLocationを有効にする
        this._gl.enableVertexAttribArray(this._location);
        // attributeLocationを通知し登録する
        this._gl.vertexAttribPointer(this._location, this._size, this._type, false, 0, 0);
    }
}
class RenderBase extends Queue {
    /** @private */
    static _MODEL_LOAD      = "MODEL_LOAD";
    /** @private */
    static _MODEL_BIND      = "MODEL_BIND";
    /** @private */
    static _MODEL_PURGE     = "MODEL_PURGE";
    /** @private */
    static _MODEL_PURGE_ALL = "MODEL_PURGE_ALL";
    /** @private */
    static _MODEL_VISIBLE   = "MODEL_VISIBLE";
    /** @private */
    static _MODEL_POSTURE   = "MODEL_POSTURE";
    /** @private */
    static _MODEL_POSITION  = "MODEL_POSITION";
    /** @private */
    static _MODEL_BONE      = "MODEL_BONE";

    /**
     * @returns {string}
     */
    get Version() { return "RenderBase"; }

    /**
     * @returns {number}
     */
    get DeltaTime() { return (this.mCurTime - this.mPreTime)*0.001; }

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {number} width
	 * @param {number} height
     */
    constructor(canvas, width, height) {
        super();
        /**
         * canvas
         * @protected
         * @type {HTMLCanvasElement}
         */
        this.mCanvas = canvas;
        this.mCanvas.width = width;
        this.mCanvas.height = height;
        /**
         * WebGLコンテキスト
         * @protected
         * @type {WebGLRenderingContext}
         */
        this.mGL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        /**
         * attribute
         * @protected @virtual
         */
        this.mAttr = null;
        /**
         * uniformLocation
         * @protected @virtual
         */
        this.mUniLoc = null;
        /** @private */
        this.mCurTime = (new Date()).getTime();
        /** @private */
        this.mPreTime = this.mCurTime;
    }

    update() {
        this._rendering();
        this.mPreTime = this.mCurTime;
        this.mCurTime = (new Date()).getTime();
    }

    /** @protected @virtual */
    _rendering() {}

    /**
     * シェーダを生成
     * @protected
     * @param {string} shaderElementId
     * @returns {WebGLShader}
     */
    _createShader(shaderElementId) {
        // HTMLからscriptタグへの参照を取得
        /** @type {HTMLScriptElement} */
        let scriptElement = document.getElementById(shaderElementId);
        if (!scriptElement) {
            // scriptタグが存在しない場合は抜ける
            return null;
        }

        // scriptタグのtype属性をチェックして格納
        /** @type {WebGLShader} */
        let shader;
        switch (scriptElement.type) {
            case 'x-shader/x-vertex':
                // 頂点シェーダの場合
                shader = this.mGL.createShader(this.mGL.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                // フラグメントシェーダの場合
                shader = this.mGL.createShader(this.mGL.FRAGMENT_SHADER);
                break;
            default:
                return;
        }

        // 生成されたシェーダにソースを割り当てる
        this.mGL.shaderSource(shader, scriptElement.text);

        // シェーダをコンパイルする
        this.mGL.compileShader(shader);

        // シェーダが正しくコンパイルされたかチェック
        if (this.mGL.getShaderParameter(shader, this.mGL.COMPILE_STATUS)) {
            // 成功していたらシェーダを返して終了
            return shader;
        } else {
            // 失敗していたらエラーログをアラートする
            alert(this.mGL.getShaderInfoLog(shader));
            return null;
        }
    }

    /**
     * プログラムオブジェクトを生成しシェーダをリンク
     * @protected
     * @param  {...WebGLShader} shaders
     * @returns {WebGLProgram}
     */
    _createProgram(...shaders) {
        // プログラムオブジェクトの生成
        let program = this.mGL.createProgram();

        // プログラムオブジェクトにシェーダを割り当てる
        for (let i in shaders) {
            this.mGL.attachShader(program, shaders[i]);
        }

        // シェーダをリンク
        this.mGL.linkProgram(program);

        // シェーダのリンクが正しく行なわれたかチェック
        if (this.mGL.getProgramParameter(program, this.mGL.LINK_STATUS)) {
            // 成功していたらプログラムオブジェクトを有効にする
            this.mGL.useProgram(program);
            // プログラムオブジェクトを返して終了
            return program;
        } else {
            // 失敗していたらエラーログをアラートする
            alert(this.mGL.getProgramInfoLog(program));
            return null;
        }
    }

    /**
     * VBOを生成
     * @protected
     * @param {number[]} data
     */
    _createVbo(data) {
        // バッファオブジェクトの生成
        let vbo = this.mGL.createBuffer();
        // バッファをバインドする
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, vbo);
        // バッファにデータをセット
        this.mGL.bufferData(this.mGL.ARRAY_BUFFER, new Float32Array(data), this.mGL.STATIC_DRAW);
        // バッファのバインドを無効化
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
        // 生成した VBO を返して終了
        return vbo;
    }

    /**
     * IBOを生成
     * @protected
     * @param {number[]} data
     */
    _createIbo(data) {
        // バッファオブジェクトの生成
        let ibo = this.mGL.createBuffer();
        // バッファをバインドする
        this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, ibo);
        // バッファにデータをセット
        this.mGL.bufferData(this.mGL.ELEMENT_ARRAY_BUFFER, new Int16Array(data), this.mGL.STATIC_DRAW);
        // バッファのバインドを無効化
        this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, null);
        // 生成したIBOを返して終了
        return ibo;
    }

    /**
     * @protected
     */
    _msgLoop() {
        while(0 < this._que.length) {
            let msg = this._dequeue();
            switch(msg.ID) {
            case RenderBase._MODEL_LOAD:
                this._modelLoad(msg.Sender, msg.Value.Id, msg.Value.InstanceId);
                break;
            case RenderBase._MODEL_BIND:
                this._modelBind(msg.Sender, msg.Value.Id, msg.Value.InstanceId);
                break;
            case RenderBase._MODEL_PURGE:
                this._modelPurge(msg.Sender, msg.Value.Id, msg.Value.InstanceId);
                break;
            case RenderBase._MODEL_PURGE_ALL:
                this._modelPurgeAll(msg.Sender);
                break;
            case RenderBase._MODEL_VISIBLE:
                this._modelVisible(msg.Sender, msg.Value);
                break;
            case RenderBase._MODEL_POSTURE:
                this._modelPosture(msg.Sender, msg.Value);
                break;
            case RenderBase._MODEL_POSITION:
                this._modelPosition(msg.Sender, msg.Value);
                break;
            case RenderBase._MODEL_BONE:
                this._modelBone(msg.Sender, msg.Value);
                break;
            }
        }
    }

    /**
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    modelLoad(sender, id, instanceId) {
        this._enqueue(RenderBase._MODEL_LOAD, sender, {Id:id, InstanceId:instanceId});
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    _modelLoad(sender, id, instanceId) {}

    /**
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    modelBind(sender, id, instanceId) {
        this._enqueue(RenderBase._MODEL_BIND, sender, {Id:id, InstanceId:instanceId});
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    _modelBind(sender, id, instanceId) {}

    /**
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    modelPurge(sender, id, instanceId) {
        this._enqueue(RenderBase._MODEL_PURGE, sender, {Id:id, InstanceId:instanceId});
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {string} id
     * @param {string} instanceId
     */
    _modelPurge(sender, id, instanceId) {}

    /**
     * @param {any} sender
     */
    modelPurgeAll(sender) {
        this._enqueue(RenderBase._MODEL_PURGE_ALL, sender, null);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     */
    _modelPurgeAll(sender) {}

    /**
     * @param {any} sender
     * @param {number} alpha
     */
    modelVisible(sender, alpha) {
        this._enqueue(RenderBase._MODEL_VISIBLE, sender, alpha);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {number} alpha
     */
    _modelVisible(sender, alpha) {}

    /**
     * @param {any} sender
     * @param {Posture} posture
     */
    modelPosture(sender, posture) {
        this._enqueue(RenderBase._MODEL_POSTURE, sender, posture);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {Posture} posture
     */
    _modelPosture(sender, posture) {}

    /**
     * @param {any} sender
     * @param {Mat} position
     */
    modelPosition(sender, position) {
        this._enqueue(RenderBase._MODEL_POSITION, sender, position);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {Mat} position
     */
    _modelPosition(sender, position) {}

    /**
     * @param {any} sender
     * @param {BoneInfo[]} boneArray
     */
    modelBone(sender, boneArray) {
        this._enqueue(RenderBase._MODEL_BONE, sender, boneArray);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {BoneInfo[]} boneArray
     */
    _modelBone(sender, boneArray) {}
}
