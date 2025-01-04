
export class PromiseUtil {
	static tryUntilTruthy(func, args, interval, maxAttempts) {
		return new Promise((res, rej) => {
			let attempt = 0;
			const itv = setInterval(() => {
				const value = func(args);
				if(value) {
					res(value);
					clearInterval(itv);
				} else {
					attempt++;
					if(attempt >= maxAttempts) {
						rej(null);
						clearInterval(itv);
					}
				}
			}, interval);
		});
	}

};
