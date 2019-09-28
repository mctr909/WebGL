class Message {
    /**
     * @param {string} id 
     * @param {any} sender 
     * @param {any} value 
     */
    constructor(id, sender, value) {
        /** @private */
        this._id = id;
        /** @private */
        this._sender = sender;
        /** @private */
        this._value = value;
    }

    /**
     * @returns {string}
     */
    get ID() { return this._id; }

    /**
     * @returns {any}
     */
    get Sender() { return this._sender; }

    /**
     * @returns {any[]}
     */
    get Value() { return this._value; }
}

class Queue {
    constructor() {
        /** @private */
        this._que = new Array(Message);
    }

    /**
     * @protected
     * @param {string} id 
     * @param {any} sender 
     * @param {any} value 
     */
    _enqueue(id, sender, value) {
        this._que.push(new Message(id, sender, value));
    }

    /**
     * @protected
     * @returns {Message}
     */
    _dequeue() {
        if (0 < this._que.length) {
            return this._que.shift();
        }
    }
}
