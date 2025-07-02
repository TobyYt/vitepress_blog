# async/await 原理

## 起因

我们知道 <mark>Promise</mark> 的出现极大地解决了 <mark>回调地狱</mark>，但是如果使用流程非常复杂的话，就非常容易过多地调用 <mark>Promise</mark> 的 <mark>then()</mark> 方法，这样也不利于使用和阅读。

例如： 我希望在请求 www.baidu.com 后先输出请求的结果，再去请求 www.taobao.com 后再输出请求结果，如果只用 Promise 实现，那么代码就是下面的样子：

```js
fetch("https://www.baidu.com")
  .then((res) => {
    console.log(res);
    return fetch("https://www.taobao.com");
  })
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
```

这只是去请求两个网站，如果流程一旦多了，那么 <mark>then()</mark> 方法的调用也是随之增加的，虽然整个过程较为线性，但是代码的阅读性依然很差。所以，在 es7 中提出了 async/await 来让我们能够用同步的方式来实现异步，但是要记住 <mark>async/await</mark> 只是一个语法糖，其本质依然还是异步的，不过是让我们可以用同步的方式来书写而已。我们可以看一下下面的代码，同样是解决上面的的问题：

```js
async function main() {
  try {
    const res = await fetch("https://www.baidu.com");
    console.log(res);
    const res2 = await fetch("https://www.taobao.com");
    console.log(res2);
  } catch (err) {
    console.log(err);
  }
}
main();
```

使用 <mark>async/await</mark> 让代码的书写就和同步一样，并且还可以使用 <mark>try catch</mark> 来捕获错误。试问一下，这两种书写方式，对于程序员来说会选择哪一个呢？

## 原理

在我看来，<mark>async/await</mark> 的使用就好像是把函数暂停了一样，当执行到 <mark>await</mark> 时，函数暂停执行，直到 <mark>await</mark> 等待的 <mark>Promise</mark> 状态改变了，才会回到这个函数执行。这种方式是不是很眼熟？是的，这简直就跟生成器的工作方式一模一样，所以要弄懂 <mark>async/await</mark> 的原理前，我们要先了解一下生成器是如何工作的。不过在了解生成器之前，我先介绍一下协程这个概念。

## 协程

协程（coroutine）是一种程序组件，允许在单个线程中执行多个任务。协程允许我们暂停和恢复执行，而无需使用线程切换。协程是轻量级的，因为它们不需要分配单独的线程或堆栈。相反，它们共享相同的线程和堆栈空间。

协程带来的好处就是可以提升性能，协程的切换并不会像线程切换那样过多地消耗资源。了解了协程的存在，我们就可以知道为什么会有生成器了。

## 生成器

生成器（generator）是一种特殊的函数（就是前面带有\*的一个函数），它返回一个迭代器（iterator）。迭代器是一个对象，它允许我们在不使用循环的情况下遍历数据集合。生成器函数使用 <mark>yield</mark> 关键字来暂停和恢复执行。在外部函数中可以通过调用 <mark>next()</mark> 方法来恢复函数的执行，当生成器函数被调用时，它返回一个迭代器对象，该对象允许我们在不使用循环的情况下遍历生成器函数生成的数据。

```js
function* generator() {
  console.log("step 1");
  yield 1;
  console.log("step 2");
  yield 2;
  console.log("step 3");
  yield 3;
}

const iterator = generator();
console.log(iterator.next().value);
console.log(iterator.next().value);
console.log(iterator.next().value);
```

执行上述代码，你就会发现这个函数不是立马就被执行完的，而是在分布执行，我们可以分析一下：

1. 执行生成器 generator，此时主线程执行 generator 函数，打印 step 1

2. 执行到 yield 关键字，generator 函数暂停执行，转到外部函数协程，并返回 yield 关键字抛出的值

3. 外部函数协程执行 next()方法,该方法的返回值的 value 属性值就是 yield 抛出的值，打印 1，并切换协程，主线程执行 generator 函数协程。

4. 打印 step 2， 执行到 yield 关键字，generator 函数协程暂停执行，转到外部函数协程，并返回 yield 关键字抛出的值。

5. 外部函数协程执行 next()方法,该方法的返回值的 value 属性值就是 yield 抛出的值，打印 2，并切换协程，主线程执行 generator 函数协程。

6. 打印 step 3， 执行到 yield 关键字，generator 函数协程暂停执行，转到外部函数协程，并返回 yield 关键字抛出的值。

7. 外部函数协程执行 next()方法,该方法的返回值的 value 属性值就是 yield 抛出的值，打印 3，并切换协程，主线程执行 generator 函数协程

8. generator 函数执行完毕，该协程销毁，转到外部函数协程继续执行代码。

9. 通过上面生成器与协程的分析，想必 <mark>async/await</mark> 的原理已经要呼之欲出了，那么让我们来正式开始 <mark>async/await</mark> 的原理揭秘。

## async

<mark>async</mark> 在 MDN 上的定义就是一个通过异步执行并隐式返回一个 <mark>Promise</mark> 作为结果的函数。 我们需要关注两个地方，<mark>异步执行和隐式返回 Promise</mark>, 异步执行先放到后面说，对于隐式返回 <mark>Promise</mark>，我们可以通过代码来一窥究竟。

```js
async function foo() {
  return 1;
}
console.log(foo()); // Promise {<resolved>: 1}
```

执行这段代码，我们可以看到调用 <mark>async</mark> 声明的 foo 函数返回了一个 <mark>Promise</mark> 对象，状态是 <mark>resolved</mark>。

## await

<mark>await</mark> 关键字用于等待一个 <mark>Promise</mark> 对象，它只能在 <mark>async</mark> 函数内部使用。

我们来通过一段代码来分析 <mark>await</mark> 到底做了什么

```js
async function foo() {
  console.log(1);
  const res = await 2;
  console.log(res);
}
console.log(3);
foo();
console.log(4);

打印结果：
// 3
// 1
// 4
// 2
```

为什么是 3 1 4 2 呢？明明是先执行了 <mark>foo</mark> 函数再打印的 4，为什么 4 会在 2 前面呢？这就要提到我们之前说的生成器了,<mark>await</mark> 正是在这基础上做到的。下面我们站在生成器和协程的角度来看下这段代码是如何执行的。

1. 首先由于 <mark>foo</mark> 函数被 <mark>async</mark> 标记过，所以当进入该函数的时候， <mark>JavaScript</mark> 引擎会保存当前的调用栈等待信息。

2. 全局执行上下文在主线程上执行，我们这里暂且将全局执行上下文叫做父协程，打印 3

3. <mark>foo</mark> 函数执行，主线程控制权由父协程转为 <mark>foo</mark> 函数协程，打印 1

4. 执行到 <mark>await 2</mark>，在这里做了两件事，第一是新建一个 <mark>Promise</mark>

```js
let Promise_ = new Promise((resolve, reject) => {
  resolve(2);
});
```

在该 <mark>Promise</mark> 的创建中我们看到在执行器中调用了 <mark>resolve</mark> 函数，这是 <mark>JavaScript</mark> 引擎会将该任务放入 <mark>Promise</mark> 的微任务（何为微任务下篇讲解）队列中，等待执行。

第二是暂停 <mark>foo</mark> 函数的执行，也就是做了 <mark>yield</mark> 关键字的事情，切换协程，将主线程的控制权交给父协程，并向父协程返回 <mark>Promise</mark> 对象。

当父协程恢复执行时，会通过调用返回的 <mark>Promise</mark> 对象的 <mark>then</mark> 方法来监听 <mark>Promise</mark> 的状态，当这个 <mark>Promise</mark> 状态改变时会再次切换协程，将主线程控制权交给 <mark>foo</mark> 函数协程。 我们可以通过一段代码进行模拟：

```js
Promise_.then((res) => {
  // 因为async返回的是Promise，所以没有next方法，但是内部实现原理是一样的，可以当做参考
  foo().next(res);
});
```

5. 父协程在主线程上运行，打印 4

6. 父协程的代码都执行完毕，到达微任务队列的检查点，发现了微任务队列中有 <mark>reslove(2)</mark> 需要执行，执行这个任务的时候，会执行该 <mark>Promise</mark> 的 <mark>then</mark> 方法注册的所有回调函数，也就是上述的代码，这时会再次切换协程，主线程上执行 <mark>foo</mark> 函数协程，打印 2。

以上就是 <mark>async/await</mark> 的执行流程。正是因为 <mark>await</mark> 的存在，才使得 <mark>async/await</mark> 可以用同步的方式书写出异步代码，同时 <mark>await</mark> 也使得 <mark>async/await</mark> 的执行流程变得清晰。

## 总结

<mark>Promise</mark> 的出现帮助我们解决了回调地域，但是也带来一个问题————then 链，同样使得代码不易阅读。而 <mark>async/await</mark> 的出现解决了这个问题，它使得异步代码看起来像同步代码一样，同时它也使得异步代码的执行流程变得清晰极大程度上提高了代码的易读性。而 <mark>async/await</mark> 的实现离不开生成器和协程的概念，正是通过生成器可以自由地切换协程才使得我们可以暂停和恢复一个函数的执行。同样，浏览器 V8 引擎也做了许多事，内部做了大量的语法封装才使得我们能够使用 <mark>async/await</mark> 语法糖。
