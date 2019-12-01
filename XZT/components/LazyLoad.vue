<template>
	<view :class="boxClassName">
		<!-- height: `${item.height}${PX_UNIT}`, -->
		<view
			v-for="(item, index) in dataList"
			:key="item.id"
			:class="[itemClassName, childClass, `${itemClassName}-${index}`]"
			:style="{
				top: `${item.lazyTop}${PX_UNIT}`,
				left: `${item.lazyLeft}${PX_UNIT}`,
				visibility: item.lazyShow ? 'visible' : 'hidden',
				opacity: item.lazyShow ? 1 : 0
			}"
		>
			<image class="image" mode="widthFix" :src="item.lazyImg ? item.img : lazyImgURL" @load="imgLoaded($event, index)"></image>
			<text class="desc">图片{{ index }}</text>
		</view>
	</view>
</template>
<script>
const api = uni;
const PX_UNIT = 'px';
// 监听的对象集合

let observerMap = Object.create(null);
// 保存索引对应正常的top值
let waterfallMap = Object.create(null);

// 页面盒子
const boxClassName = 'lazy-box';
const boxClass = '.lazy-box';
let boxWidth;
let boxHeight;
// 每个item Class
const itemClassName = 'lazy-item';
const itemClass = '.lazy-item';

// 每页最后一个索引的下标集合，并且已经触发过加载事件的下标
const lastIndexArr = [];

// 列数，默认0
let colNumber = 0;
// 每列高度 数组
const colHeightArr = [];
// 每列的最后一个下标
const colIndexArr = [];
/** 动画部分变量 start */
// 动画移动的距离
const animalDistance = 50;
/** 动画部分变量 end */
// 屏幕宽是750的比率,
// 标准宽度
const standardWidth = 750;
const device = api.getSystemInfoSync();
const deviceWidth = device.screenWidth;
const screenRate = deviceWidth / standardWidth;
// 长度计算（upx转px）
const calcRate = val => val * screenRate;

const defaultOptions = {
	verticalDistance: 0,
	horizontalDistance: 0
};
let startTime;
// 图片懒加载
let lazyImgIndex = false;
export default {
	props: {
		imageClass: {
			type: String,
			default: '.image'
		},
		lazyImgURL: {
			type: String,
			default:
				'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1575128156488&di=3dee1b332268909d0a58f5e5d377fb25&imgtype=0&src=http%3A%2F%2Fimg.zcool.cn%2Fcommunity%2F01286f5a05131ca80121985c7fdd07.gif'
		},
		paddingLeft: {
			type: Number,
			default: 0
		},
		paddingTop: {
			type: Number,
			default: 0
		},
		// 添加子类class
		childClass: {
			type: String,
			default: ''
		},
		// 横向间距
		verticalDistance: {
			type: Number,
			default: 20
		},
		// 竖向间距
		horizontalDistance: {
			type: Number,
			default: 20
		},
		allData: {
			type: Array,
			default: () => []
		}
	},
	data() {
		return {
			PX_UNIT: PX_UNIT,
			boxClassName: boxClassName,
			itemClassName: itemClassName,
			itemClass: itemClass,
			dataList: []
		};
	},
	watch: {
		allData: {
			deep: true,
			immediate: true,
			handler(newV, oldV) {
				// 新的长度 长于 旧的的长度 表示加载了下一页的数据
				if (newV && (!oldV || (oldV && newV.length > oldV.length))) {
					newV.forEach((item, i) => {
						if (this.dataList[i]) {
							Object.assign(this.dataList[i], item);
						} else {
							this.dataList.push(item);
						}
					});
					this.init();
				}
			}
		}
	},
	mounted() {},
	beforeDestroy() {
		this.clearObserve();
	},
	methods: {
		// 图片加载完成
		imgLoaded(evt, index) {
			this.getRect(`${itemClass}-${index} ${this.imageClass}`).then(async data => {
				lazyImgIndex = index;
				await this.handlerWaterfall();
				// await this.generateObserve();
			});
		},
		// 点击item
		clickIt(item, evt) {
			this.$emit('clickItem', item, evt);
		},
		// 初始化
		async init() {
			startTime = +new Date();
			// 先计算父元素的宽高
			await this.calcParentPos();
			// 计算列数
			await this.calcColNum();
			// 执行瀑布流 和 懒加载
			this.$nextTick(async () => {
				console.log(startTime);
				await this.handlerWaterfall();
				console.log('处理瀑布流耗时：', +new Date() - startTime);
				await this.generateObserve();
				console.log('处理懒加载耗时：', +new Date() - startTime);
			});
		},
		// 绑定监听
		generateObserve() {
			return new Promise((resolve, reject) => {
				this.dataList.forEach((item, i) => {
					// 性能优化
					if (observerMap[i]) return false;
					// 指定父级窗口
					let observer = api.createIntersectionObserver(this).relativeTo(boxClass, { bottom: animalDistance, top: animalDistance });
					// 指定页面窗口
					// else observer = api.createIntersectionObserver(this).relativeToViewport();
					// 绑定可视事件
					observer.observe(`${this.itemClass}-${i}`, res => {
						const lastFlag = i === this.dataList.length - 1;
						// 在窗口可视范围内
						if (res.intersectionRatio > 0) {
							// 最后一个显示在可视区域，默认已经到底，可以加载更多数据
							if (item.lazyTop && lastFlag && !lastIndexArr.includes(i)) {
								lastIndexArr.push(i);
								// 触发给父组件
								console.log('触发');
								this.$emit('onBottom');
							}
							// 图片懒加载 到位
							this.$set(this.dataList[i], 'lazyImg', true);
							// top值归位
							this.$set(this.dataList[i], 'lazyTop', waterfallMap[i]);
							// 显示
							this.$set(this.dataList[i], 'lazyShow', true);
						} else {
							// 如果目标节点的边界
							let {
								boundingClientRect: { bottom }
							} = res;
							// 如果目标节点的边界 bottom 大于 父元素的高，就是从下而上，否则是从上而下。
							if (bottom >= boxHeight) {
								// 如果消失在可视范围内，就稍微向上移动点距离
								this.$set(this.dataList[i], 'lazyTop', this.dataList[i].lazyTop + animalDistance);
							} else {
								this.$set(this.dataList[i], 'lazyTop', this.dataList[i].lazyTop - animalDistance);
							}
							// 隐藏
							this.$set(this.dataList[i], 'lazyShow', false);
						}
						if (lastFlag) {
							resolve();
						}
					});
					observerMap[i] = observer;
				});
			});
		},
		// 删除监听
		clearObserve() {
			const observerKeys = Object.keys(observerMap);
			if (observerKeys.length > 0) {
				observerKeys.forEach(key => observerMap[key].disconnect());
				setTimeout(()=> observerMap = Object.create(null));
			}
		},
		// 计算父元素的宽高
		async calcParentPos() {
			if (boxWidth && boxHeight) return Promise.resolve();
			const data = await this.getRect(boxClass);
			const { width, height } = data;
			boxWidth = width;
			boxHeight = height;
			return Promise.resolve(data);
		},
		// 计算列数
		async calcColNum() {
			if (this.dataList.length > 0) {
				// 计算一行可以有几列（总宽度+间隙  除以  单项宽度+间隙）
				// 计算距离
				const data = await this.getRect(`${itemClass}-0`);
				colNumber = Math.floor((boxWidth + calcRate(this.verticalDistance)) / (Number(data.width) + calcRate(this.verticalDistance)));
			}
			return Promise.resolve(colNumber);
		},
		// 瀑布流布局处理
		handlerWaterfall(data) {
			return this.getRectAll(this.itemClass).then(data => {
				this.handlerWaterfallItem(data);
				return Promise.resolve();
			});
		},
		// handler waterfall item
		handlerWaterfallItem(data) {
			data.forEach((pos, i) => {
				// 性能优化，定位过的item，不用再计算了。
				if (waterfallMap[i] || waterfallMap[i] === 0) return;
				if (i < colNumber) {
					colHeightArr.push(pos.height);
					colIndexArr.push(i);
					this.$set(this.dataList[i], 'lazyLeft', calcRate(this.paddingLeft) + i * (pos.width + calcRate(this.verticalDistance)));
					this.$set(this.dataList[i], 'lazyTop', calcRate(this.paddingTop));
					// 记录已经定位的下标
					waterfallMap[i] = this.dataList[i].lazyTop;
				} else {
					// 最小高度
					const minHeight = Math.min(...colHeightArr);
					// 最小高度的下标---colHeightArr中的
					const minHeightIndex = colHeightArr.indexOf(minHeight);
					// 最小高度的下标---dataList中的
					const minIndex = colIndexArr[minHeightIndex];
					//  获取对应下标的元素的位置，
					this.$set(this.dataList[i], 'lazyLeft', this.dataList[minIndex].lazyLeft);
					this.$set(this.dataList[i], 'lazyTop', calcRate(this.paddingTop) + minHeight + calcRate(this.horizontalDistance) + animalDistance);
					// 更新最小高度
					colHeightArr[minHeightIndex] = minHeight + pos.height + calcRate(this.horizontalDistance);
					// 更新每列的下标
					colIndexArr[minHeightIndex] = i;
					// 记录已经定位的下标
					waterfallMap[i] = this.dataList[i].lazyTop - animalDistance;
				}
			});
		},
		// 获取元素的位置信息
		getRect(className) {
			return new Promise((resolve, reject) => {
				api.createSelectorQuery()
					.in(this)
					.select(className)
					.boundingClientRect(data => {
						resolve(data);
					})
					.exec();
			});
		},
		// 获取所有元素的位置信息
		getRectAll(className) {
			return new Promise((resolve, reject) => {
				api.createSelectorQuery()
					.in(this)
					.selectAll(className)
					.boundingClientRect(data => {
						resolve(data);
					})
					.exec();
			});
		}
	}
};
</script>

<style scoped lang="scss">
.lazy-box {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	overflow-y: scroll;
	position: relative;
	.lazy-item {
		position: absolute;
		visibility: hidden;
		transition: opacity 400ms, top 400ms;
	}
}
</style>
