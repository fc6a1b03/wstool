"use strict"

/**
 * 创建Vue实例
 */
const {createApp, ref, reactive, nextTick} = Vue;

// 状态过滤器
const rStatus = (value) => {
    switch (value) {
        case undefined:
            return '尚未创建'
        case 0:
            return '尚未开启'
        case 1:
            return '连接成功'
        case 2:
            return '正在关闭'
        case 3:
            return '连接关闭'
        default:
            return '未知状态'
    }
}

const app = createApp({
    setup() {
        // 响应式状态
        const consoleData = ref([]);
        const messageData = ref([]);
        const instance = ref(WebSocket);
        const address = ref('ws://127.0.0.1:9501');
        const parameters = ref([{key: '', val: ''}]);
        const alert = reactive({
            class: 'success',
            state: false,
            content: '',
            timer: undefined
        });
        const content = ref('');
        const heartBeatSecond = ref(1);
        const heartBeatContent = ref('PING');
        const autoSend = ref(false);
        const autoTimer = ref(undefined);
        const sendClean = ref(false);
        const recvClean = ref(false);
        const recvDecode = ref(false);
        const connected = ref(false);
        const recvPause = ref(false);

        // 方法
        const addParameter = () => {
            parameters.value.push({key: '', val: ''});
        };

        const deleteParameter = (index) => {
            if (parameters.value.length > 1) {
                parameters.value.splice(index, 1);
            }
        };

        const showTips = (className, tipContent) => {
            clearTimeout(alert.timer);
            alert.state = false;
            alert.class = className;
            alert.content = tipContent;
            alert.state = true;
            alert.timer = setTimeout(() => {
                alert.state = false;
            }, 3000);
        };

        const scrollOver = (e) => {
            if (e) {
                e.scrollTop = e.scrollHeight;
            }
        };

        const writeConsole = (className, msgContent) => {
            consoleData.value.push({
                content: msgContent,
                type: className,
                time: moment().format('HH:mm:ss')
            });
            nextTick(() => {
                scrollOver(document.getElementById('console-box'));
            });
        };

        const writeNews = (direction, msgContent, callback) => {
            if (typeof callback === 'function') {
                msgContent = callback(msgContent);
            }

            messageData.value.push({
                direction: direction,
                content: msgContent,
                time: moment().format('HH:mm:ss')
            });

            nextTick(() => {
                if (!recvClean.value) {
                    scrollOver(document.getElementById('message-box'));
                }
            });
        };

        const writeAlert = (className, alertContent) => {
            writeConsole(className, alertContent);
            showTips(className, alertContent);
        };

        const closeCode = (code) => {
            const codes = {
                1000: '1000 CLOSE_NORMAL',
                1001: '1001 CLOSE_GOING_AWAY',
                1002: '1002 CLOSE_PROTOCOL_ERROR',
                1003: '1003 CLOSE_UNSUPPORTED',
                1004: '1004 CLOSE_RETAIN',
                1005: '1005 CLOSE_NO_STATUS',
                1006: '1006 CLOSE_ABNORMAL',
                1007: '1007 UNSUPPORTED_DATA',
                1008: '1008 POLICY_VIOLATION',
                1009: '1009 CLOSE_TOO_LARGE',
                1010: '1010 MISSING_EXTENSION',
                1011: '1011 INTERNAL_ERROR',
                1012: '1012 SERVICE_RESTART',
                1013: '1013 TRY_AGAIN_LATER',
                1014: '1014 CLOSE_RETAIN',
                1015: '1015 TLS_HANDSHAKE'
            };
            let error = codes[code];
            if (error === undefined) error = '0000 UNKNOWN_ERROR 未知错误';
            return error;
        };

        const sendData = (raw) => {
            let data = raw;
            if (typeof data === 'object') {
                data = content.value;
            }
            try {
                instance.value.send(data);
                writeNews(1, data);
                if (sendClean.value && typeof raw === 'object') content.value = '';
            } catch (err) {
                writeAlert('danger', '消息发送失败 原因请查看控制台');
                throw err;
            }
        };

        const autoHeartBeat = () => {
            if (autoSend.value === true) {
                autoSend.value = false;
                clearInterval(autoTimer.value);
            } else {
                autoSend.value = true;
                autoTimer.value = setInterval(() => {
                    writeConsole('info', `循环发送: ${heartBeatContent.value}`);
                    sendData(heartBeatContent.value);
                }, heartBeatSecond.value * 1000);
            }
        };

        const autoWsConnect = () => {
            try {
                if (connected.value === false) {
                    localStorage.setItem('address', address.value);
                    localStorage.setItem('parameters', JSON.stringify(parameters.value));
                    // 将参数对象转换为查询字符串
                    const paramsStr = parameters.value
                        .filter(param => param.key && param.val)
                        .map(param =>
                            `${encodeURIComponent(param.key)}=${encodeURIComponent(param.val)}`
                        )
                        .join('&');
                    // 条件拼接地址
                    let wsInstance = new WebSocket(paramsStr ? `${address.value}?${paramsStr}` : address.value);

                    wsInstance.onopen = (ev) => {
                        console.warn(ev);
                        connected.value = true;
                        let service = instance.value.url.replace('ws://', '').replace('wss://', '');
                        service = (service.substring(service.length - 1) === '/') ? service.substring(0, service.length - 1) : service;
                        writeAlert('success', 'OPENED => ' + service);
                    };

                    wsInstance.onclose = (ev) => {
                        console.warn(ev);
                        autoSend.value = false;
                        clearInterval(autoTimer.value);
                        connected.value = false;
                        writeAlert('danger', 'CLOSED => ' + closeCode(ev.code));
                    };

                    wsInstance.onerror = (ev) => {
                        console.warn(ev);
                        writeConsole('danger', '发生错误 请打开浏览器控制台查看');
                    };

                    wsInstance.onmessage = (ev) => {
                        console.warn(ev);
                        if (!recvPause.value) {
                            let data = ev.data;
                            if (recvClean.value) messageData.value = [];
                            writeNews(0, data);
                        }
                    };

                    instance.value = wsInstance;
                } else {
                    instance.value.close(1000, 'Active closure of the user');
                }
            } catch (err) {
                console.warn(err);
                writeAlert('danger', '创建 WebSocket 对象失败 请检查服务器地址');
            }
        };

        const canUseH5WebSocket = () => {
            if ('WebSocket' in window) {
                writeAlert('success', '初始化完成');
            } else {
                writeAlert('danger', '当前浏览器不支持 H5 WebSocket 请更换浏览器');
            }
        };

        const cleanMessage = () => {
            messageData.value = [];
        };

        const clearCache = () => {
            localStorage.clear();
        };

        // 生命周期钩子
        const init = () => {
            canUseH5WebSocket();
            let savedAddress = localStorage.getItem('address');
            if (typeof savedAddress === 'string') address.value = savedAddress;
            parameters.value = JSON.parse(localStorage.getItem('parameters')) || [{key: '', val: ''}];
            window.onerror = (ev) => {
                console.warn(ev);
            };
        };

        init();

        // 返回响应式状态和方法
        return {
            consoleData,
            messageData,
            instance,
            address,
            parameters,
            alert,
            content,
            heartBeatSecond,
            heartBeatContent,
            autoSend,
            autoTimer,
            sendClean,
            recvClean,
            recvDecode,
            connected,
            recvPause,
            rStatus: (value) => rStatus(value),
            addParameter,
            deleteParameter,
            showTips,
            autoWsConnect,
            autoHeartBeat,
            writeConsole,
            writeNews,
            writeAlert,
            canUseH5WebSocket,
            closeCode,
            sendData,
            scrollOver,
            cleanMessage,
            clearCache
        };
    }
});

app.mount('#root');