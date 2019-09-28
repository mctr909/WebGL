/// <reference path="math.js"/>
/// <reference path="render_base.js"/>
class Render extends RenderBase {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(canvas, width, height) {
		super(canvas, width, height);
		/** 登録モデル */
		this.mModels = new Array();
		/** バインド中モデル */
		this.mBindingModel = null;
		/** ビュー */
		this.mMatView = new Mat();
		/** プロジェクション */
		this.mMatProj = new Mat();
		/** ビュー×プロジェクション */
		this.mMatViewProj = new Mat();
		/** カメラ */
		this.mCam = null;
		/** 光源 */
		this.mLight = null;
		this._initialize();
	}

	/**
	 * 初期化
	 * @private
	 */
	_initialize() {
		this.mGL.enable(this.mGL.DEPTH_TEST);	// 深度テスト有効化
		this.mGL.depthFunc(this.mGL.LEQUAL);	// 深度テスト(手前側を表示)
		this.mGL.enable(this.mGL.CULL_FACE);	// カリング有効化

		// 頂点シェーダとフラグメントシェーダの生成
		// プログラムオブジェクトの生成とリンク
		let v_shader = this._createShader('vs');
		let f_shader = this._createShader('fs');
		let prg = this._createProgram(v_shader, f_shader);

		// attributeを取得
		this.mAttr = {
			pos: new ShaderAttribute(this.mGL, prg, this.mGL.FLOAT, 3, "position"),
			nor: new ShaderAttribute(this.mGL, prg, this.mGL.FLOAT, 3, "normal"),
			col: new ShaderAttribute(this.mGL, prg, this.mGL.FLOAT, 4, "color")
		};

		// uniformLocationの取得
		this.mUniLoc = {
			matMVP: this.mGL.getUniformLocation(prg, 'mvpMatrix'),
			matModel: this.mGL.getUniformLocation(prg, 'mMatrix'),
			matInvModel: this.mGL.getUniformLocation(prg, 'invMatrix'),
			lightDirection: this.mGL.getUniformLocation(prg, 'lightDirection'),
			eyeDirection: this.mGL.getUniformLocation(prg, 'eyeDirection'),
			ambientColor: this.mGL.getUniformLocation(prg, 'ambientColor')
		};
	}

	/**
	 * モデルデータ読み込み
	 * @protected @override
	 * @param {any} sender
	 * @param {string} id
	 * @param {string} instanceId
	 */
	_modelLoad(sender, id, instanceId) {
		let torusData = torus(256, 256, 1.0, 2.0);
		let sphereData = sphere(256, 256, 1.0);
		if (null != this.mModels[id]) {
			return;
		}
		switch (id) {
		case "A":
			this.mModels[id] = {
				name: "torus",
				position: this._createVbo(torusData[0]),
				normal: this._createVbo(torusData[1]),
				color: this._createVbo(torusData[2]),
				index: this._createIbo(torusData[3]),
				indexCount: torusData[3].length
			};
			break;
		case "B":
			this.mModels[id] = {
				name: "sphere",
				position: this._createVbo(sphereData[0]),
				normal: this._createVbo(sphereData[1]),
				color: this._createVbo(sphereData[2]),
				index: this._createIbo(sphereData[4]),
				indexCount: sphereData[4].length
			};
			break;
		default:
			break;
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
		this.mAttr.pos.bindBuffer(this.mBindingModel.position);
		this.mAttr.nor.bindBuffer(this.mBindingModel.normal);
		this.mAttr.col.bindBuffer(this.mBindingModel.color);
		// IBOをバインドする
		this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, this.mBindingModel.index);
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
		this.mGL.drawElements(this.mGL.TRIANGLES, this.mBindingModel.indexCount, this.mGL.UNSIGNED_SHORT, 0);
	}

	/**
	 * @protected @override
	 */
	_rendering() {
		// canvasを初期化
		this.mGL.clearColor(0.0, 0.0, 0.0, 1.0);
		this.mGL.clearDepth(1.0);
		this.mGL.clear(this.mGL.COLOR_BUFFER_BIT | this.mGL.DEPTH_BUFFER_BIT);

		// カメラの位置カメラの向き
		this.mCam = {
			position: [0.0, 0.0, 80.0],
			upDirection: [0.0, 1.0, 0.0]
		};

		// 光源の向き, 環境光の色
		this.mLight = {
			direction: [1.0, 1.0, 1.0],
			ambientColor: [0.1, 0.1, 0.1, 1.0]
		};

		// ビュー×プロジェクション座標変換行列
		this.mMatView.lookAt(this.mCam.position, [0, 0, 0], this.mCam.upDirection);
		this.mMatProj.perspective(45, 0.1, 200, this.mCanvas.width / this.mCanvas.height);
		Mat.multiply(this.mMatProj, this.mMatView, this.mMatViewProj);

		//
		this._msgLoop();

		// コンテキストの再描画
		this.mGL.flush();
	}
}

function hsva(h, s, v, a) {
	if(s > 1 || v > 1 || a > 1){return;}
	var th = h % 360;
	var i = Math.floor(th / 60);
	var f = th / 60 - i;
	var m = v * (1 - s);
	var n = v * (1 - s * f);
	var k = v * (1 - s * (1 - f));
	var color = new Array();
	if(!s > 0 && !s < 0){
		color.push(v, v, v, a);
	} else {
		var r = new Array(v, n, m, m, k, v);
		var g = new Array(k, v, v, n, m, m);
		var b = new Array(m, m, k, v, v, n);
		color.push(r[i], g[i], b[i], a);
	}
	return color;
}

function torus(row, column, irad, orad){
	let pos = new Array();
	let nor = new Array();
	let col = new Array();
	let idx = new Array();

	for(var i = 0; i <= row; i++){
		var r = Math.PI * 2 / row * i;
		var rr = Math.cos(r);
		var ry = Math.sin(r);
		for(var ii = 0; ii <= column; ii++){
			var tr = Math.PI * 2 / column * ii;
			var tx = (rr * irad + orad) * Math.cos(tr);
			var ty = ry * irad;
			var tz = (rr * irad + orad) * Math.sin(tr);
			var rx = rr * Math.cos(tr);
			var rz = rr * Math.sin(tr);
			pos.push(tx, ty, tz);
			nor.push(rx, ry, rz);
			var tc = hsva(360 / column * ii, 1, 1, 1);
			col.push(tc[0], tc[1], tc[2], tc[3]);
		}
	}
	for(i = 0; i < row; i++){
		for(ii = 0; ii < column; ii++){
			r = (column + 1) * i + ii;
			idx.push(r, r + column + 1, r + 1);
			idx.push(r + column + 1, r + column + 2, r + 1);
		}
	}
	return [pos, nor, col, idx];
}

function sphere(row, column, rad, color) {
	var i, j, tc;
	var pos = new Array(), nor = new Array(),
		col = new Array(), st  = new Array(), idx = new Array();
	for(i = 0; i <= row; i++){
		var r = Math.PI / row * i;
		var ry = Math.cos(r);
		var rr = Math.sin(r);
		for(j = 0; j <= column; j++){
			var tr = Math.PI * 2 / column * j;
			var tx = rr * rad * Math.cos(tr);
			var ty = ry * rad;
			var tz = rr * rad * Math.sin(tr);
			var rx = rr * Math.cos(tr);
			var rz = rr * Math.sin(tr);
			if(color){
				tc = color;
			}else{
				tc = hsva(360 / row * i, 1, 1, 1);
			}
			pos.push(tx, ty, tz);
			nor.push(rx, ry, rz);
			col.push(tc[0], tc[1], tc[2], tc[3]);
			st.push(1 - 1 / column * j, 1 / row * i);
		}
	}
	r = 0;
	for(i = 0; i < row; i++){
		for(j = 0; j < column; j++){
			r = (column + 1) * i + j;
			idx.push(r, r + 1, r + column + 2);
			idx.push(r, r + column + 2, r + column + 1);
		}
	}
	return [pos, nor, col, st, idx];
}
