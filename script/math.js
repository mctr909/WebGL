class Vec {
	constructor(x=0.0, y=0.0, z=0.0) {
		this._a = new Float32Array(3);
		this._a[0] = x;
		this._a[1] = y;
		this._a[2] = z;
	}
	get Array() {
		return this._a;
	}
	/**
	 * @param {Vec} va
	 * @param {Vec} vb
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	static add(va, vb, returnValue) {
		returnValue._a[0] = va._a[0] + vb._a[0];
		returnValue._a[1] = va._a[1] + vb._a[1];
		returnValue._a[2] = va._a[2] + vb._a[2];
		return returnValue;
	}
	/**
	 * @param {Vec} va
	 * @param {Vec} vb
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	static sub(va, vb, returnValue) {
		returnValue._a[0] = va._a[0] - vb._a[0];
		returnValue._a[1] = va._a[1] - vb._a[1];
		returnValue._a[2] = va._a[2] - vb._a[2];
		return returnValue;
	}
	/**
	 * @param {Vec} va
	 * @param {Vec} vb
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	static cross(va, vb, returnValue) {
		returnValue._a[0] = va._a[1]*vb._a[2] - va._a[2]*vb._a[1];
		returnValue._a[1] = va._a[2]*vb._a[0] - va._a[0]*vb._a[2];
		returnValue._a[2] = va._a[0]*vb._a[1] - va._a[1]*vb._a[0];
		return returnValue;
	}
	/**
	 * @param {Vec} va
	 * @param {Vec} vb
	 * @returns {number}
	 */
	static dot(va, vb) {
		return (va._a[0]*vb._a[0] + va._a[1]*vb._a[1] + va._a[2]*vb._a[2]);
	}
	/**
	 * @param {Vec} v
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	static normal(v, returnValue) {
		let l = Math.sqrt(v._a[0]*v._a[0] + v._a[1]*v._a[1] + v._a[2]*v._a[2]);
		if (0===l) {
			returnValue._a[0] = 0;
			returnValue._a[1] = 0;
			returnValue._a[2] = 0;
		} else {
			l = 1 / l;
			returnValue._a[0] = v._a[0]*l;
			returnValue._a[1] = v._a[1]*l;
			returnValue._a[2] = v._a[2]*l;
		}
		return returnValue;
	}
	/**
	 * @param {Vec} v
	 * @param {number} k
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	static scale(v, k, returnValue) {
		returnValue._a[0] = v._a[0]*k;
		returnValue._a[1] = v._a[1]*k;
		returnValue._a[2] = v._a[2]*k;
		return returnValue;
	}
}

class Mat {
	constructor() {
		/** @private */
		this._a = new Float32Array(16);
	}

	get Array() {
		return this._a;
	}

	/**
	 * @returns {Mat}
	 */
	get Copy() {
		let ret = new Mat();
		for(let i in this._a) {
			ret._a[i] = this._a[i];
		}
		return ret;
	}

	/**
	 * @returns {Mat}
	 */
	identity() {
		this._a[0]  = 1; this._a[1]  = 0; this._a[2]  = 0; this._a[3]  = 0;
		this._a[4]  = 0; this._a[5]  = 1; this._a[6]  = 0; this._a[7]  = 0;
		this._a[8]  = 0; this._a[9]  = 0; this._a[10] = 1; this._a[11] = 0;
		this._a[12] = 0; this._a[13] = 0; this._a[14] = 0; this._a[15] = 1;
		return this;
	}

	/**
	 * @param {number[]} eye
	 * @param {number[]} center
	 * @param {number[]} up
	 * @returns {Mat}
	 */
	lookAt(eye, center, up) {
		let eyeX = eye[0],
			eyeY = eye[1],
			eyeZ = eye[2]
		;
		let	centerX = center[0],
			centerY = center[1],
			centerZ = center[2]
		;
		if (eyeX == centerX && eyeY == centerY && eyeZ == centerZ) {
			return this.identity();
		}

		let ecX = eyeX - centerX,
			ecY = eyeY - centerY,
			ecZ = eyeZ - centerZ
		;
		let n = 1 / Math.sqrt(ecX * ecX + ecY * ecY + ecZ * ecZ);
		ecX *= n;
		ecY *= n;
		ecZ *= n;

		let u_ecX = up[1] * ecZ - up[2] * ecY;
		let u_ecY = up[2] * ecX - up[0] * ecZ;
		let u_ecZ = up[0] * ecY - up[1] * ecX;
		n = Math.sqrt(u_ecX * u_ecX + u_ecY * u_ecY + u_ecZ * u_ecZ);
		if (!n) {
			u_ecX = 0;
			u_ecY = 0;
			u_ecZ = 0;
		} else {
			n = 1 / n;
			u_ecX *= n;
			u_ecY *= n;
			u_ecZ *= n;
		}

		let ec_u_ecX = ecY * u_ecZ - ecZ * u_ecY,
			ec_u_ecY = ecZ * u_ecX - ecX * u_ecZ,
			ec_u_ecZ = ecX * u_ecY - ecY * u_ecX
		;
		n = Math.sqrt(ec_u_ecX * ec_u_ecX + ec_u_ecY * ec_u_ecY + ec_u_ecZ * ec_u_ecZ);
		if (!n) {
			ec_u_ecX = 0;
			ec_u_ecY = 0;
			ec_u_ecZ = 0;
		} else {
			n = 1 / n;
			ec_u_ecX *= n;
			ec_u_ecY *= n;
			ec_u_ecZ *= n;
		}

		this._a[0] = u_ecX;
		this._a[1] = ec_u_ecX;
		this._a[2] = ecX;
		this._a[3] = 0;

		this._a[4] = u_ecY;
		this._a[5] = ec_u_ecY;
		this._a[6] = ecY;
		this._a[7] = 0;

		this._a[8]  = u_ecZ;
		this._a[9]  = ec_u_ecZ;
		this._a[10] = ecZ;
		this._a[11] = 0;

		this._a[12] = -(u_ecX    * eyeX + u_ecY    * eyeY + u_ecZ    * eyeZ);
		this._a[13] = -(ec_u_ecX * eyeX + ec_u_ecY * eyeY + ec_u_ecZ * eyeZ);
		this._a[14] = -(ecX      * eyeX + ecY      * eyeY + ecZ      * eyeZ);
		this._a[15] = 1;
		return this;
	}

	/**
	 * @param {number} fovy
	 * @param {number} near
	 * @param {number} far
	 * @param {number} aspect
	 * @returns {Mat}
	 */
	perspective(fovy, near, far, aspect=1.776) {
		let f_n = far - near;
		let t = near * Math.tan(fovy * Math.PI / 360);
		let r = t * aspect;

		this._a[0] = near / r;
		this._a[1] = 0;
		this._a[2] = 0;
		this._a[3] = 0;

		this._a[4] = 0;
		this._a[5] = near / t;
		this._a[6] = 0;
		this._a[7] = 0;

		this._a[8] = 0;
		this._a[9] = 0;
		this._a[10] = -(far + near) / f_n;
		this._a[11] = -1;

		this._a[12] = 0;
		this._a[13] = 0;
		this._a[14] = -(far * near * 2) / f_n;
		this._a[15] = 0;
		return this;
	}

	/**
	 * @param {Mat} matrix
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static transpose(matrix, returnValue) {
		returnValue._a[0]  = matrix._a[0];
		returnValue._a[1]  = matrix._a[4];
		returnValue._a[2]  = matrix._a[8];
		returnValue._a[3]  = matrix._a[12];

		returnValue._a[4]  = matrix._a[1];
		returnValue._a[5]  = matrix._a[5];
		returnValue._a[6]  = matrix._a[9];
		returnValue._a[7]  = matrix._a[13];

		returnValue._a[8]  = matrix._a[2];
		returnValue._a[9]  = matrix._a[6];
		returnValue._a[10] = matrix._a[10];
		returnValue._a[11] = matrix._a[14];

		returnValue._a[12] = matrix._a[3];
		returnValue._a[13] = matrix._a[7];
		returnValue._a[14] = matrix._a[11]
		returnValue._a[15] = matrix._a[15];
		return returnValue;
	}

	/**
	 * @param {Mat} matrix
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static inverse(matrix, returnValue) {
		let m11 = matrix._a[0],  m12 = matrix._a[1],  m13 = matrix._a[2],  m14 = matrix._a[3],
			m21 = matrix._a[4],  m22 = matrix._a[5],  m23 = matrix._a[6],  m24 = matrix._a[7],
			m31 = matrix._a[8],  m32 = matrix._a[9],  m33 = matrix._a[10], m34 = matrix._a[11],
			m41 = matrix._a[12], m42 = matrix._a[13], m43 = matrix._a[14], m44 = matrix._a[15]
		;
		let m1122_1221 = m11 * m22 - m12 * m21,
			m1123_1321 = m11 * m23 - m13 * m21,
			m1124_1421 = m11 * m24 - m14 * m21,
			m1223_1322 = m12 * m23 - m13 * m22,
			m1224_1422 = m12 * m24 - m14 * m22,
			m1324_1423 = m13 * m24 - m14 * m23,
			m3142_3241 = m31 * m42 - m32 * m41,
			m3143_3341 = m31 * m43 - m33 * m41,
			m3144_3441 = m31 * m44 - m34 * m41,
			m3243_3342 = m32 * m43 - m33 * m42,
			m3244_3442 = m32 * m44 - m34 * m42,
			m3344_3443 = m33 * m44 - m34 * m43
		;
		let n = 1 / (
			  m1122_1221 * m3344_3443
			- m1123_1321 * m3244_3442
			+ m1124_1421 * m3243_3342
			+ m1223_1322 * m3144_3441
			- m1224_1422 * m3143_3341
			+ m1324_1423 * m3142_3241
		);

		returnValue._a[0]  = ( m22 * m3344_3443 - m23 * m3244_3442 + m24 * m3243_3342) * n;
		returnValue._a[1]  = (-m12 * m3344_3443 + m13 * m3244_3442 - m14 * m3243_3342) * n;
		returnValue._a[2]  = ( m42 * m1324_1423 - m43 * m1224_1422 + m44 * m1223_1322) * n;
		returnValue._a[3]  = (-m32 * m1324_1423 + m33 * m1224_1422 - m34 * m1223_1322) * n;

		returnValue._a[4]  = (-m21 * m3344_3443 + m23 * m3144_3441 - m24 * m3143_3341) * n;
		returnValue._a[5]  = ( m11 * m3344_3443 - m13 * m3144_3441 + m14 * m3143_3341) * n;
		returnValue._a[6]  = (-m41 * m1324_1423 + m43 * m1124_1421 - m44 * m1123_1321) * n;
		returnValue._a[7]  = ( m31 * m1324_1423 - m33 * m1124_1421 + m34 * m1123_1321) * n;

		returnValue._a[8]  = ( m21 * m3244_3442 - m22 * m3144_3441 + m24 * m3142_3241) * n;
		returnValue._a[9]  = (-m11 * m3244_3442 + m12 * m3144_3441 - m14 * m3142_3241) * n;
		returnValue._a[10] = ( m41 * m1224_1422 - m42 * m1124_1421 + m44 * m1122_1221) * n;
		returnValue._a[11] = (-m31 * m1224_1422 + m32 * m1124_1421 - m34 * m1122_1221) * n;

		returnValue._a[12] = (-m21 * m3243_3342 + m22 * m3143_3341 - m23 * m3142_3241) * n;
		returnValue._a[13] = ( m11 * m3243_3342 - m12 * m3143_3341 + m13 * m3142_3241) * n;
		returnValue._a[14] = (-m41 * m1223_1322 + m42 * m1123_1321 - m43 * m1122_1221) * n;
		returnValue._a[15] = ( m31 * m1223_1322 - m32 * m1123_1321 + m33 * m1122_1221) * n;
		return returnValue;
	}

	/**
	 * @param {Mat} ma
	 * @param {Mat} mb
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static multiply(ma, mb, returnValue) {
		let a11 = ma._a[0],  a12 = ma._a[1],  a13 = ma._a[2],  a14 = ma._a[3],
			a21 = ma._a[4],  a22 = ma._a[5],  a23 = ma._a[6],  a24 = ma._a[7],
			a31 = ma._a[8],  a32 = ma._a[9],  a33 = ma._a[10], a34 = ma._a[11],
			a41 = ma._a[12], a42 = ma._a[13], a43 = ma._a[14], a44 = ma._a[15]
		;
		let b11 = mb._a[0],  b12 = mb._a[1],  b13 = mb._a[2],  b14 = mb._a[3],
			b21 = mb._a[4],  b22 = mb._a[5],  b23 = mb._a[6],  b24 = mb._a[7],
			b31 = mb._a[8],  b32 = mb._a[9],  b33 = mb._a[10], b34 = mb._a[11],
			b41 = mb._a[12], b42 = mb._a[13], b43 = mb._a[14], b44 = mb._a[15]
		;
		returnValue._a[0]  = a11 * b11 + a21 * b12 + a31 * b13 + a41 * b14;
		returnValue._a[1]  = a12 * b11 + a22 * b12 + a32 * b13 + a42 * b14;
		returnValue._a[2]  = a13 * b11 + a23 * b12 + a33 * b13 + a43 * b14;
		returnValue._a[3]  = a14 * b11 + a24 * b12 + a34 * b13 + a44 * b14;

		returnValue._a[4]  = a11 * b21 + a21 * b22 + a31 * b23 + a41 * b24;
		returnValue._a[5]  = a12 * b21 + a22 * b22 + a32 * b23 + a42 * b24;
		returnValue._a[6]  = a13 * b21 + a23 * b22 + a33 * b23 + a43 * b24;
		returnValue._a[7]  = a14 * b21 + a24 * b22 + a34 * b23 + a44 * b24;

		returnValue._a[8]  = a11 * b31 + a21 * b32 + a31 * b33 + a41 * b34;
		returnValue._a[9]  = a12 * b31 + a22 * b32 + a32 * b33 + a42 * b34;
		returnValue._a[10] = a13 * b31 + a23 * b32 + a33 * b33 + a43 * b34;
		returnValue._a[11] = a14 * b31 + a24 * b32 + a34 * b33 + a44 * b34;

		returnValue._a[12] = a11 * b41 + a21 * b42 + a31 * b43 + a41 * b44;
		returnValue._a[13] = a12 * b41 + a22 * b42 + a32 * b43 + a42 * b44;
		returnValue._a[14] = a13 * b41 + a23 * b42 + a33 * b43 + a43 * b44;
		returnValue._a[15] = a14 * b41 + a24 * b42 + a34 * b43 + a44 * b44;
		return returnValue;
	}

	/**
	 * @param {Mat} matrix
	 * @param {Vec} vector
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static scale(matrix, vector, returnValue) {
		returnValue._a[0]  = matrix._a[0]  * vector._a[0];
		returnValue._a[1]  = matrix._a[1]  * vector._a[0];
		returnValue._a[2]  = matrix._a[2]  * vector._a[0];
		returnValue._a[3]  = matrix._a[3]  * vector._a[0];
		returnValue._a[4]  = matrix._a[4]  * vector._a[1];
		returnValue._a[5]  = matrix._a[5]  * vector._a[1];
		returnValue._a[6]  = matrix._a[6]  * vector._a[1];
		returnValue._a[7]  = matrix._a[7]  * vector._a[1];
		returnValue._a[8]  = matrix._a[8]  * vector._a[2];
		returnValue._a[9]  = matrix._a[9]  * vector._a[2];
		returnValue._a[10] = matrix._a[10] * vector._a[2];
		returnValue._a[11] = matrix._a[11] * vector._a[2];
		returnValue._a[12] = matrix._a[12];
		returnValue._a[13] = matrix._a[13];
		returnValue._a[14] = matrix._a[14];
		returnValue._a[15] = matrix._a[15];
		return returnValue;
	}

	/**
	 * @param {Mat} matrix
	 * @param {Vec} vector
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static translate(matrix, vector, returnValue) {
		returnValue._a[0] = matrix._a[0];
		returnValue._a[1] = matrix._a[1];
		returnValue._a[2] = matrix._a[2];
		returnValue._a[3] = matrix._a[3];

		returnValue._a[4] = matrix._a[4];
		returnValue._a[5] = matrix._a[5];
		returnValue._a[6] = matrix._a[6];
		returnValue._a[7] = matrix._a[7];

		returnValue._a[8]  = matrix._a[8];
		returnValue._a[9]  = matrix._a[9];
		returnValue._a[10] = matrix._a[10];
		returnValue._a[11] = matrix._a[11];

		returnValue._a[12]
			= matrix._a[0] * vector._a[0]
			+ matrix._a[4] * vector._a[1]
			+ matrix._a[8] * vector._a[2]
			+ matrix._a[12]
		;
		returnValue._a[13]
			= matrix._a[1] * vector._a[0]
			+ matrix._a[5] * vector._a[1]
			+ matrix._a[9] * vector._a[2]
			+ matrix._a[13]
		;
		returnValue._a[14]
			= matrix._a[2]  * vector._a[0]
			+ matrix._a[6]  * vector._a[1]
			+ matrix._a[10] * vector._a[2]
			+ matrix._a[14]
		;
		returnValue._a[15]
			= matrix._a[3]  * vector._a[0]
			+ matrix._a[7]  * vector._a[1]
			+ matrix._a[11] * vector._a[2]
			+ matrix._a[15]
		;
		return returnValue;
	}

	/**
	 * @param {Mat} matrix
	 * @param {number} angle
	 * @param {Vec} axis
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	static rotate(matrix, angle, axis, returnValue) {
		let sq = Math.sqrt(axis._a[0]*axis._a[0] + axis._a[1]*axis._a[1] + axis._a[2]*axis._a[2]);
		if (!sq) {
			return null;
		}
		let aX = axis._a[0],
			aY = axis._a[1],
			aZ = axis._a[2]
		;
		if (sq != 1) {
			sq = 1 / sq;
			aX *= sq;
			aY *= sq;
			aZ *= sq;
		}

		let aS = Math.sin(angle),
			aC = Math.cos(angle),
			aCi = 1 - aC
		;
		let aXX = aX * aX * aCi + aC,
			aXY = aY * aX * aCi + aZ * aS,
			aXZ = aZ * aX * aCi - aY * aS
		;
		let aYX = aX * aY * aCi - aZ * aS,
			aYY = aY * aY * aCi + aC,
			aYZ = aZ * aY * aCi + aX * aS
		;
		let aZX = aX * aZ * aCi + aY * aS,
			aZY = aY * aZ * aCi - aX * aS,
			aZZ = aZ * aZ * aCi + aC
		;
		let m11 = matrix._a[0],  m12 = matrix._a[1], m13 = matrix._a[2],  m14 = matrix._a[3],
			m21 = matrix._a[4],  m22 = matrix._a[5], m23 = matrix._a[6],  m24 = matrix._a[7],
			m31 = matrix._a[8],  m32 = matrix._a[9], m33 = matrix._a[10], m34 = matrix._a[11]
		;
		if (angle) {
			if (matrix != returnValue) {
				returnValue._a[12] = matrix._a[12];
				returnValue._a[13] = matrix._a[13];
				returnValue._a[14] = matrix._a[14];
				returnValue._a[15] = matrix._a[15];
			}
		} else {
			returnValue = matrix;
		}

		returnValue._a[0]  = m11 * aXX + m21 * aXY + m31 * aXZ;
		returnValue._a[1]  = m12 * aXX + m22 * aXY + m32 * aXZ;
		returnValue._a[2]  = m13 * aXX + m23 * aXY + m33 * aXZ;
		returnValue._a[3]  = m14 * aXX + m24 * aXY + m34 * aXZ;

		returnValue._a[4]  = m11 * aYX + m21 * aYY + m31 * aYZ;
		returnValue._a[5]  = m12 * aYX + m22 * aYY + m32 * aYZ;
		returnValue._a[6]  = m13 * aYX + m23 * aYY + m33 * aYZ;
		returnValue._a[7]  = m14 * aYX + m24 * aYY + m34 * aYZ;

		returnValue._a[8]  = m11 * aZX + m21 * aZY + m31 * aZZ;
		returnValue._a[9]  = m12 * aZX + m22 * aZY + m32 * aZZ;
		returnValue._a[10] = m13 * aZX + m23 * aZY + m33 * aZZ;
		returnValue._a[11] = m14 * aZX + m24 * aZY + m34 * aZZ;
		return returnValue;
	}
}

class Qtn {
	constructor() {
		/** @private */
		this._a = new Float32Array(4);
	}

	/**
	 * @returns {Qtn}
	 */
	identity() {
		this._a[0] = 0;
		this._a[1] = 0;
		this._a[2] = 0;
		this._a[3] = 1;
		return this;
	}

	/**
	 * @param {Mat} returnValue
	 * @returns {Mat}
	 */
	toMat(returnValue) {
		let x = this._a[0],
			y = this._a[1],
			z = this._a[2],
			w = this._a[3]
		;
		let x2 = x + x, y2 = y + y, z2 = z + z;
		let xx = x * x2, xy = x * y2, xz = x * z2;
		let yy = y * y2, yz = y * z2, zz = z * z2;
		let wx = w * x2, wy = w * y2, wz = w * z2;
		returnValue._a[0]  = 1 - (yy + zz);
		returnValue._a[1]  = xy - wz;
		returnValue._a[2]  = xz + wy;
		returnValue._a[3]  = 0;
		returnValue._a[4]  = xy + wz;
		returnValue._a[5]  = 1 - (xx + zz);
		returnValue._a[6]  = yz - wx;
		returnValue._a[7]  = 0;
		returnValue._a[8]  = xz - wy;
		returnValue._a[9]  = yz + wx;
		returnValue._a[10] = 1 - (xx + yy);
		returnValue._a[11] = 0;
		returnValue._a[12] = 0;
		returnValue._a[13] = 0;
		returnValue._a[14] = 0;
		returnValue._a[15] = 1;
		return returnValue;
	}

	/**
	 * @param {Vec} v
	 * @param {Vec} returnValue
	 * @returns {Vec}
	 */
	toVec(v, returnValue) {
		let qp = new Qtn();
		let qq = new Qtn();
		let qr = new Qtn();
		Qtn.inverse(this, qr);
		qp._a[0] = v._a[0];
		qp._a[1] = v._a[1];
		qp._a[2] = v._a[2];
		Qtn.multiply(qr, qp, qq);
		Qtn.multiply(qq, qtn, qr);
		returnValue._a[0] = qr._a[0];
		returnValue._a[1] = qr._a[1];
		returnValue._a[2] = qr._a[2];
		return returnValue;
	}

	/**
	 * @param {Qtn} qtn
	 * @param {Qtn} returnValue
	 * @returns {Qtn}
	 */
	static inverse(qtn, returnValue) {
		returnValue._a[0] = -qtn._a[0];
		returnValue._a[1] = -qtn._a[1];
		returnValue._a[2] = -qtn._a[2];
		returnValue._a[3] =  qtn._a[3];
		return returnValue;
	}

	/**
	 * @param {Qtn} qtn
	 * @param {Qtn} returnValue
	 * @returns {Qtn}
	 */
	static normalize(qtn, returnValue) {
		let x = qtn._a[0],
			y = qtn._a[1],
			z = qtn._a[2],
			w = qtn._a[3]
		;
		let l = Math.sqrt(x * x + y * y + z * z + w * w);
		if (l === 0) {
			returnValue._a[0] = 0;
			returnValue._a[1] = 0;
			returnValue._a[2] = 0;
			returnValue._a[3] = 0;
		} else {
			l = 1 / l;
			returnValue._a[0] = x * l;
			returnValue._a[1] = y * l;
			returnValue._a[2] = z * l;
			returnValue._a[3] = w * l;
		}
		return returnValue;
	}

	/**
	 * @param {Qtn} qa
	 * @param {Qtn} qb
	 * @param {Qtn} returnValue
	 * @returns {Qtn}
	 */
	static multiply(qa, qb, returnValue) {
		let ax = qa._a[0], ay = qa._a[1], az = qa._a[2], aw = qa._a[3];
		let bx = qb._a[0], by = qb._a[1], bz = qb._a[2], bw = qb._a[3];
		returnValue._a[0] = ax * bw + aw * bx + ay * bz - az * by;
		returnValue._a[1] = ay * bw + aw * by + az * bx - ax * bz;
		returnValue._a[2] = az * bw + aw * bz + ax * by - ay * bx;
		returnValue._a[3] = aw * bw - ax * bx - ay * by - az * bz;
		return returnValue;
	}

	/**
	 * @param {number} angle
	 * @param {Vec} axis
	 * @param {Qtn} returnValue
	 * @returns {Qtn}
	 */
	static rotate(angle, axis, returnValue) {
		let sq = Math.sqrt(axis._a[0]*axis._a[0] + axis._a[1]*axis._a[1] + axis._a[2]*axis._a[2]);
		if (!sq) {
			return null;
		}
		let a = axis._a[0],
			b = axis._a[1],
			c = axis._a[2]
		;
		if (sq != 1) {
			sq = 1 / sq;
			a *= sq;
			b *= sq;
			c *= sq;
		}
		let s = Math.sin(angle * 0.5);
		returnValue._a[0] = a * s;
		returnValue._a[1] = b * s;
		returnValue._a[2] = c * s;
		returnValue._a[3] = Math.cos(angle * 0.5);
		return returnValue;
	}

	/**
	 * @param {Qtn} qa
	 * @param {Qtn} qb
	 * @param {number} time
	 * @param {Qtn} returnValue
	 * @returns {Qtn}
	 */
	static slerp(qa, qb, time, returnValue) {
		var ht
			= qa._a[0] * qb._a[0]
			+ qa._a[1] * qb._a[1]
			+ qa._a[2] * qb._a[2]
			+ qa._a[3] * qb._a[3]
		;
		var hs = 1.0 - ht * ht;
		if (hs <= 0.0) {
			returnValue._a[0] = qa._a[0];
			returnValue._a[1] = qa._a[1];
			returnValue._a[2] = qa._a[2];
			returnValue._a[3] = qa._a[3];
		} else {
			hs = Math.sqrt(hs);
			if (Math.abs(hs) < 0.0001) {
				returnValue._a[0] = (qa._a[0] * 0.5 + qb._a[0] * 0.5);
				returnValue._a[1] = (qa._a[1] * 0.5 + qb._a[1] * 0.5);
				returnValue._a[2] = (qa._a[2] * 0.5 + qb._a[2] * 0.5);
				returnValue._a[3] = (qa._a[3] * 0.5 + qb._a[3] * 0.5);
			} else {
				var ph = Math.acos(ht);
				var pt = ph * time;
				var t0 = Math.sin(ph - pt) / hs;
				var t1 = Math.sin(pt) / hs;
				returnValue._a[0] = qa._a[0] * t0 + qb._a[0] * t1;
				returnValue._a[1] = qa._a[1] * t0 + qb._a[1] * t1;
				returnValue._a[2] = qa._a[2] * t0 + qb._a[2] * t1;
				returnValue._a[3] = qa._a[3] * t0 + qb._a[3] * t1;
			}
		}
		return returnValue;
	}
}
