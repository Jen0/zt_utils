/**
 * 方法节流/防抖
 * 可配置参数 Options 
 * once 只执行一次
 * isStart 立即执行/延迟执行
 */
const debounce = (fn, delay, options = {}) => {
	if (typeof fn !== 'function') {
		throw new TypeError('Expected a function');
	}
	if (!delay) return fn;
	// 上一次调用的时间
	let lastTime,
		// args 
		fnArgs,
		// this
		fnThis,
		// 原函数返回值
		fnResult,
		// 延迟执行
		delayTimer,
		// 是否已执行过
		isExecuted = false;
	// 可配置项
	// 是否初始就调用,默认是
	// 是否执行一次,默认是
	const {
		once = true, isStart = false
	} = options;
	// 清除所有内存
	const init = () => {
		lastTime = null;
		fnArgs = null;
		fnThis = null;
		if (delayTimer) {
			clearTimeout(delayTimer);
			delayTimer = null;
		}
	}
	// 清除所有内存方法
	const clearTimer = (now) => {
		// 最后一次执行函数的时间
		const lastCallTime = now;
		// 取一个比间隔数值大的数值,这里去大1秒
		const delayTime = delay + 2000;
		let clearVar = setTimeout(() => {
			// 最后一次执行函数的时间 - 最后一次调用的时间 >= 0 ---> 就说明是最后一次调用
			if (lastCallTime - lastTime >= 0) {
				init();
			}
			clearTimeout(clearVar);
			clearVar = null;
		}, delayTime);
	}
	// 定时器执行方法
	const executingFn = (now) => {
		lastTime = now;
		isExecuted = true;
		clearTimer(now);
		return fnResult = fn.apply(fnThis, fnArgs);
	}

	// 返回promise
	const delayReturn = (now) => {
		return new Promise((resolve, reject) => {
			delayTimer = setTimeout(() => resolve(executingFn()), delay);
		})
	}
	// 闭包函数
	const closure = function(...args) {
		// 如果只执行一次,那么参数,this指向都是第一次的时候
		fnThis = (once ? fnThis : this) || this;
		fnArgs = (once ? fnArgs : args) || args;
		const now = +new Date();
		// 立即执行(首次)
		if (isStart && !isExecuted) {
			return executingFn(now);
		}
		// 只执行一次
		if (once) {
			if (isExecuted) return;
			// 延迟执行,返回Promise
			isExecuted = true;
			return delayReturn(now)
		}
		// 循环执行
		else {
			// 延迟执行(首次没有标识isExecuted 为true,只是给最后一次时间赋值 )
			if (!lastTime) lastTime = now;
			// 到达间隔时间执行
			if (lastTime && now - lastTime >= delay) {
				return executingFn(now);
			}
		}
	}

	closure.options = options;
	closure.init = init;
	return closure;
}

export default debounce;
