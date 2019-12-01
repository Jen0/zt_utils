<template>
	<view class="page"><LazyLoad :allData="dataList" childClass="list-item" :paddingLeft="25" :paddingTop="25" @onBottom="onBottom" @clickItem="clickItem"></LazyLoad></view>
</template>
<script>
import parseHtml from '@/utils/html-parser.js';
import LazyLoad from '@/components/LazyLoad.vue';
import debounce from '@/utils/debounce.js';
const colors = ['#e31d65', '#ffcb36', '#007d97', '#553ab8', '#ff7c35', '#25a954'];
const imgUrlArr = [
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575121194276&di=5d29e0c14eff4aceb44b3ae8c8354317&imgtype=0&src=http%3A%2F%2Fpic.90sjimg.com%2Fback_pic%2Fqk%2Fback_origin_pic%2F00%2F03%2F26%2F5cf4e8f749b5e18fcb2ff2c9e43cf850.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575123799308&di=971269e6a79cee865cb170ed67ded61e&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F038105f5a3a3166a801201a1ffd9549.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575127747084&di=e13c930df221ed60b35636d1cec30f14&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01702e568643f66ac7251bb6e5d788.jpg%401280w_1l_2o_100sh.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575127759544&di=225840cd7cac0be8dbd98ecb39e8e335&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F038bb1e576134a50000018c1bacd997.jpg',
	'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=1908240988,3044315511&fm=26&gp=0.jpg',
	'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=3661733356,1120210955&fm=26&gp=0.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575127873875&di=967955cacf4cf5820350b2b8b27bc0d5&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F038cf115a0eefaba80121985c90d9a5.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575127894122&di=13aedbe9e5c776202a1e3d2beb5d3082&imgtype=0&src=http%3A%2F%2Fbpic.ooopic.com%2F16%2F37%2F73%2F16377319-c3a13b105750557ec4239b4b5ade3cd3.jpg',
	'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575722626&di=1f43cf2c7b1a53a90c0643a61c2e35ec&imgtype=jpg&er=1&src=http%3A%2F%2Fww1.sinaimg.cn%2Flarge%2F8b4d0240gw1faxdfghdj7j21jk10b7ad.jpg'
];
const randomNumber = length => Math.floor(Math.random() * length);
// mock数据
const mockData = () => {
	return Array.from(new Array(100)).map((o, i) => ({
		id: Math.random() * 1000000 + 1,
		img: imgUrlArr[randomNumber(imgUrlArr.length - 1)]
	}));
};
export default {
	components: {
		LazyLoad
	},
	data() {
		return {
			dataList: mockData()
		};
	},
	onLoad() {
		this.debounceFn = debounce(this.basicFn, 2000, { isStart: true, once: false });
		console.log(this.debounceFn.options);
		for (let i = 0; i < 30; i++) {
			setTimeout(() => {
				const start = +new Date();
				let val = this.debounceFn(i + 12, 2);
				if (typeof val === 'object' && val instanceof Promise) {
					val.then(data => {
						console.log(+new Date() - start, `${i} + 12 + 2 = `, data);
					});
				} else {
					console.log(+new Date() - start, `${i} + 12 + 2 = `, val);
				}
			}, i * 500);
		}
	},
	methods: {
		basicFn(a, b) {
			return a + b;
		},
		// 到底触发
		onBottom() {
			this.dataList.push(...mockData());
		},
		clickItem(item, evt) {
			console.log(item, evt);
		}
	}
};
</script>
<style lang="scss">
page {
	height: 100%;
}
</style>

<style scoped lang="scss">
.page {
	height: 100%;
}
</style>

<style lang="scss">
.list-item {
	width: 340upx;
	border-radius: 10rpx;
	box-shadow: 0rpx 0rpx 20rpx 0rpx rgba(0, 0, 0, 0.3);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #666;
	overflow: hidden;
	.image {
		width: 100%;
	}
	.desc {
		margin: 10rpx 0;
		font-size: 28rpx;
	}
}
</style>
