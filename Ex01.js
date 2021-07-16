/// <reference path="script/math.js"/>
/// <reference path="script/render.js"/>

let gCount = 0;
let gAxis = null;
let gRange = null;
let gRender = null;

(function() {
	window.requestAnimationFrame =
		window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame
	;
})();

onload = function() {
	gAxis = document.getElementById('axis');
	gRange = document.getElementById('range');
	gRender = new Render(document.getElementById("canvas"), 800, 600);
	gRender.modelLoad(this);
	let objA = new Vec(0.0, 0.0, -20.0);
	(function loop() {
		gCount = ++gCount % (6 * 360);

		let th = gAxis.value * 4*Math.atan(1) / 180.0;
		let objR = new Vec(Math.cos(th), Math.sin(th), 1.0);

		//
		let rad = gCount * Math.PI / 360;
		let time = gRange.value / 100;
		let qtnA = new Qtn();
		let qtnB = new Qtn();
		Qtn.rotate(3 * rad, objR, qtnA);
		Qtn.rotate(2 * rad, objR, qtnB);

		gRender.modelBind(this, "sphere", "");

		//
		let matModel = new Mat();
		qtnA.toMat(matModel);
		Mat.translate(matModel, objA, matModel);
		gRender.modelPosition(this, matModel.Copy);

		//
		qtnB.toMat(matModel);
		Mat.translate(matModel, objA, matModel);
		gRender.modelPosition(this, matModel.Copy);

		for (let i = 0.0; i <= 1.0; i += 0.05) {
			let qtnS = new Qtn();
			Qtn.slerp(qtnA, qtnB, i, qtnS);
			qtnS.toMat(matModel);
			Mat.translate(matModel, objA, matModel);
			gRender.modelPosition(this, matModel.Copy);
		}

		//
		gRender.modelBind(this, "torus", "");
		let qtnS = new Qtn();
		Qtn.slerp(qtnA, qtnB, time, qtnS);
		qtnS.toMat(matModel);
		Mat.translate(matModel, objA, matModel);
		gRender.modelPosition(this, matModel.Copy);

		gRender.update();
		window.requestAnimationFrame(loop);
	})();
};
