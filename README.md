PSPDFKit lazy loading problem on FF example repo

1. Install packages: `yarn`
2. Start: `yarn start`
3. Open http://localhost:3000 with FF and click on "hello world". PSPDFKit will be lazy loaded 
and fail with an error similar to (open browser dev tools):

``` javascript
Loading failed for the <script> with source “http://localhost:3000/0.js:55:1__webpack_require__@http:/localhost:3000/test.js:833:30fn@http:/localhost:3000/test.js:130:20@webpack-internal:/test/viewer/pspdfkit.js:5:85@webpack-internal:/test/viewer/pspdfkit.js:54:30./test/viewer/pspdfkit.js@http:/localhost:3000/1.js:23:1__webpack_require__@http:/localhost:3000/test.js:833:30fn@http:/localhost:3000/test.js:130:20@webpack-internal:/test/viewer/index.js:3:86@webpack-internal:/test/viewer/index.js:616:30./test/viewer/index.js@http:/localhost:3000/1.js:11:1__webpack_require__@http:/localhost:3000/test.js:833:30fn@http:/localhost:3000/test.js:130:20promise%20callback*_callee$@webpack-internal:/test/home.js:70:103tryCatch@webpack-internal:/node_modules/regenerator-runtime/runtime.js:63:40invoke@webpack-internal:/node_modules/regenerator-runtime/runtime.js:293:30defineIteratorMethods/%3C/%3C@webpack-internal:/node_modules/regenerator-runtime/runtime.js:118:21asyncGeneratorStep@webpack-internal:/test/home.js:15:103_next@webpack-internal:/test/home.js:17:212_asyncToGenerator/%3C/%3C@webpack-internal:/test/home.js:17:369_asyncToGenerator/%3C@webpack-internal:/test/home.js:17:97callCallback@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:188:14invokeGuardedCallbackDev@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:237:16invokeGuardedCallback@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:292:31invokeGuardedCallbackAndCatchFirstError@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:306:25executeDispatch@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:389:42executeDispatchesInOrder@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:414:20executeDispatchesAndRelease@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3278:29executeDispatchesAndReleaseTopLevel@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3287:10forEachAccumulated@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3259:8runEventsInBatch@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3304:21runExtractedPluginEventsInBatch@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3514:19handleTopLevel@webpack-internal:/node_modules/react-dom/cjs/react-dom.development.js:3558:36batchedEventUpdates$1@webpack-internal:/node_modules/r
```

4. Open http://localhost:3000 with any other browser and it will just load chunks fine. PSPDFKit will
fail to initialize though (but that's not important here).


5. To test a prod build:

`yarn build`

`./node_modules/http-server/bin/http-server dist`
