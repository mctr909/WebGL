/// <reference path="queue.js"/>
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
     * @param {Array<number>} posture
     */
    modelPosture(sender, posture) {
        this._enqueue(RenderBase._MODEL_POSTURE, sender, posture);
    }
    /**
     * @protected @virtual
     * @param {any} sender
     * @param {Array<number>} posture
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
