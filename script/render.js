/// <reference path="math.js"/>
/// <reference path="render_base.js"/>
/// <reference path="model.js"/>
class ShaderVar {
	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {WebGLProgram} prg
	 */
	constructor(gl, prg) {
		/**
		 * 頂点
		 * @type {ShaderAttr}
		 */
		this.ver = new ShaderAttr(gl, prg, gl.FLOAT, 3, "vertex");
		/**
		 * 法線
		 * @type {ShaderAttr}
		 */
		this.nor = new ShaderAttr(gl, prg, gl.FLOAT, 3, "normal");
		/**
		 * 頂点色
		 * @type {ShaderAttr}
		 */
		this.col = new ShaderAttr(gl, prg, gl.FLOAT, 4, "color");
	}
}

class UniformLoc {
	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {WebGLProgram} prg
	 */
	constructor(gl, prg) {
		/**
		 * MVP行列
		 * @type {WebGLUniformLocation}
		 */
		this.matMVP = gl.getUniformLocation(prg, "mvpMatrix");
		/**
		 * モデル行列
		 * @type {WebGLUniformLocation}
		 */
		this.matModel = gl.getUniformLocation(prg, "mMatrix");
		/**
		 * モデル逆行列
		 * @type {WebGLUniformLocation}
		 */
		this.matInvModel = gl.getUniformLocation(prg, "invMatrix");
		/**
		 * 光源方向
		 * @type {WebGLUniformLocation}
		 */
		this.lightDirection = gl.getUniformLocation(prg, "lightDirection");
		/**
		 * 光源色
		 * @type {WebGLUniformLocation}
		 */
		 this.ambientColor = gl.getUniformLocation(prg, "ambientColor");
		/**
		 * 視線方向
		 * @type {WebGLUniformLocation}
		 */
		this.eyeDirection = gl.getUniformLocation(prg, "eyeDirection");
	}
}

class ShaderAttr {
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

class ModelAttr {
	constructor() {
		/**
		 * 名称
		 * @type {string}
		 */
		this.name = "";
		/**
		 * 頂点
		 * @type {WebGLBuffer}
		 */
		this.ver = null;
		/**
		 * 法線
		 * @type {WebGLBuffer}
		 */
		this.nor = null;
		/**
		 * 頂点色
		 * @type {WebGLBuffer}
		 */
		this.col = null;
		/**
		 * インデックス
		 * @type {WebGLBuffer}
		 */
		this.idx = null;
		/**
		 * インデックス数
		 * @type {number}
		 */
		this.idxCount = 0;
	}
}

class LightAttr {
	constructor() {
		/**
		 * 方向
		 * @type {Array<number>}
		 */
		this.direction = [1.0, 1.0, 1.0];
		/**
		 * 色
		 * @type {Array<number>}
		 */
		this.ambientColor = [0.1, 0.1, 0.1, 1.0];
	}
}

class CamAttr {
	constructor() {
		/**
		 * 位置
		 * @type {Array<number>}
		 */
		this.position = [0.0, 0.0, 0.0];
		/**
		 * 姿勢
		 * @type {Array<number>}
		 */
		this.upDirection = [0.0, 1.0, 0.0];
	}
}

class Render extends RenderBase {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(canvas, width, height) {
		super(canvas, width, height);
		/**
		 * WebGLコンテキスト
		 * @type {WebGLRenderingContext}
		 */
		this.mGL = this.mCanvas.getContext("webgl") || this.mCanvas.getContext("experimental-webgl");
		/**
		 * 登録モデルリスト
		 * @type {Array<ModelAttr>}
		 */
		this.mModels = new Array();
		/**
		 * バインド中モデル
		 * @type {ModelAttr}
		 */
		this.mBindingModel = null;
		/**
		 * ビュー行列
		 * @type {Mat}
		 */
		this.mMatView = new Mat();
		/**
		 * プロジェクション行列
		 * @type {Mat}
		 */
		this.mMatProj = new Mat();
		/**
		 * ビュー×プロジェクション行列
		 * @type {Mat}
		 */
		this.mMatViewProj = new Mat();
		/**
		 * カメラ
		 * @type {CamAttr}
		 */
		this.mCam = new CamAttr();
		/**
		 * 光源
		 * @type {LightAttr}
		 */
		this.mLight = new LightAttr();

		this.mGL.enable(this.mGL.DEPTH_TEST);	// 深度テスト有効化
		this.mGL.depthFunc(this.mGL.LEQUAL);	// 深度テスト(手前側を表示)
		this.mGL.enable(this.mGL.CULL_FACE);	// カリング有効化

		// 頂点シェーダとフラグメントシェーダの生成
		// プログラムオブジェクトの生成とリンク
		let v_shader = this._createShader("vs");
		let f_shader = this._createShader("fs");
		let prg = this._createProgram(v_shader, f_shader);
		/**
		 * シェーダー変数
		 * @type {ShaderVar}
		 */
		this.mShaderVar = new ShaderVar(this.mGL, prg);
		/**
		 * uniform変数
		 * @type {UniformLoc}
		 */
		this.mUniLoc = new UniformLoc(this.mGL, prg);
	}

	/**
	 * シェーダを生成
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
	 * モデルデータ読み込み
	 * @protected @override
	 * @param {any} sender
	 */
	_modelLoad(sender) {
		let models = create_models();
		for (let i=0; i<models.length; i++) {
			let modelData = models[i];
			let id = modelData[0];
			if (null != this.mModels[id]) {
				return;
			}
			let modelAttr = new ModelAttr();
			modelAttr.ver = this._createVbo(modelData[1]);
			modelAttr.nor = this._createVbo(modelData[2]);
			modelAttr.col = this._createVbo(modelData[3]);
			modelAttr.idx = this._createIbo(modelData[4]);
			modelAttr.idxCount = modelData[4].length;
			this.mModels[id] = modelAttr;
		}
	}

	/**
	 * モデルデータのバインド
	 * @protected @override
	 * @param {any} sender
	 * @param {string} id
	 * @param {string} instanceId
	 */
	_modelBind(sender, id, instanceId) {
		this.mBindingModel = this.mModels[id];
		// VBOをバインドする
		this.mShaderVar.ver.bindBuffer(this.mBindingModel.ver);
		this.mShaderVar.nor.bindBuffer(this.mBindingModel.nor);
		this.mShaderVar.col.bindBuffer(this.mBindingModel.col);
		// IBOをバインドする
		this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, this.mBindingModel.idx);
	}

	/**
	 * モデルを描画
	 * @protected @override
	 * @param {any} sender
	 * @param {Mat} matModel
	 */
	_modelPosition(sender, matModel) {
		// モデル×ビュー×プロジェクション
		let matMVP = new Mat();
		Mat.multiply(this.mMatViewProj, matModel, matMVP);
		// モデル逆行列
		let matInv = new Mat();
		Mat.inverse(matModel, matInv);
		// uniformへ座標変換行列を登録し描画する
		this.mGL.uniformMatrix4fv(this.mUniLoc.matMVP, false, matMVP.Array);
		this.mGL.uniformMatrix4fv(this.mUniLoc.matModel, false, matModel.Array);
		this.mGL.uniformMatrix4fv(this.mUniLoc.matInvModel, false, matInv.Array);
		this.mGL.uniform3fv(this.mUniLoc.eyeDirection, this.mCam.position);
		this.mGL.uniform3fv(this.mUniLoc.lightDirection, this.mLight.direction);
		this.mGL.uniform4fv(this.mUniLoc.ambientColor, this.mLight.ambientColor);
		this.mGL.drawElements(this.mGL.TRIANGLES, this.mBindingModel.idxCount, this.mGL.UNSIGNED_SHORT, 0);
	}

	/**
	 * @protected @override
	 */
	_rendering() {
		// canvasを初期化
		this.mGL.clearColor(0.0, 0.0, 0.0, 1.0);
		this.mGL.clearDepth(1.0);
		this.mGL.clear(this.mGL.COLOR_BUFFER_BIT | this.mGL.DEPTH_BUFFER_BIT);

		// カメラの位置カメラの姿勢
		this.mCam.position = [0.0, 0.0, 80.0];
		this.mCam.upDirection = [0.0, 1.0, 0.0];

		// 光源の向き, 環境光の色
		this.mLight.direction = [0.0, 1.0, 0.0];
		this.mLight.ambientColor = [0.1, 0.1, 0.1, 1.0];

		// ビュー×プロジェクション座標変換行列
		this.mMatView.lookAt(this.mCam.position, [0, 0, 0], this.mCam.upDirection);
		this.mMatProj.perspective(30, 0.1, 200, this.mCanvas.width / this.mCanvas.height);
		Mat.multiply(this.mMatProj, this.mMatView, this.mMatViewProj);

		//
		this._msgLoop();

		// コンテキストの再描画
		this.mGL.flush();
	}
}
