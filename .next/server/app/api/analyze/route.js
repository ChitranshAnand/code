/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/analyze/route";
exports.ids = ["app/api/analyze/route"];
exports.modules = {

/***/ "(rsc)/./app/api/analyze/route.ts":
/*!**********************************!*\
  !*** ./app/api/analyze/route.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jszip */ \"(rsc)/./node_modules/jszip/lib/index.js\");\n/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jszip__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/supabaseClient */ \"(rsc)/./lib/supabaseClient.ts\");\n/* ────────────────────────────────────────────────────────────────\r\n   /app/api/analyze/route.ts\r\n   Accepts multipart/form‑data (\"file\" = WhatsApp .zip),\r\n   uploads to Supabase Storage, parses chat, stores metrics,\r\n   and returns the inserted row.\r\n   ──────────────────────────────────────────────────────────────── */ \n\n\nasync function POST(req) {\n    /* 1. read form‑data */ const form = await req.formData();\n    const file = form.get('file');\n    if (!file) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'No file provided'\n    }, {\n        status: 400\n    });\n    const buf = await file.arrayBuffer();\n    /* 2. upload raw zip to Supabase Storage */ const upRes = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_2__.supabase.storage.from('uploads').upload(`${Date.now()}_${file.name}`, buf, {\n        contentType: file.type\n    });\n    if (upRes.error) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: upRes.error.message\n    }, {\n        status: 500\n    });\n    /* 3. unzip + read chat txt */ const zip = await jszip__WEBPACK_IMPORTED_MODULE_1___default().loadAsync(buf);\n    const txtName = Object.keys(zip.files).find((n)=>n.endsWith('.txt'));\n    if (!txtName) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'Chat .txt not found'\n    }, {\n        status: 400\n    });\n    const chatTxt = await zip.files[txtName].async('string');\n    /* ----------  Parse & build metrics  ---------- */ const lineRx = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4}), (\\d{1,2}):(\\d{2})\\s?(AM|PM)? - ([^:]+):/;\n    const msgs = [];\n    /* helper to build a Date safely (DD/MM/YYYY HH:MM AM/PM) */ function makeDate(d, m, y, h, min, ampm) {\n        const year = y < 100 ? 2000 + y : y;\n        let hour = h;\n        if (ampm) {\n            if (ampm === 'PM' && h < 12) hour += 12;\n            if (ampm === 'AM' && h === 12) hour = 0;\n        }\n        return new Date(year, m - 1, d, hour, min);\n    }\n    chatTxt.split('\\n').forEach((raw)=>{\n        const line = raw.trim();\n        const m = lineRx.exec(line);\n        if (!m) return;\n        const [, dd, mm, yy, hh, min, ampm, author] = m;\n        const ts = makeDate(+dd, +mm, +yy, +hh, +min, ampm);\n        if (!isNaN(ts.getTime())) msgs.push({\n            ts,\n            author\n        });\n    });\n    if (msgs.length < 5) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: 'Not enough messages parsed'\n    }, {\n        status: 400\n    });\n    /* sort messages chronologically */ msgs.sort((a, b)=>a.ts.getTime() - b.ts.getTime());\n    /* ----------  existing code continues below  ---------- */ /* count msgs per author */ const counts = {};\n    for (const { author } of msgs)counts[author] = (counts[author] || 0) + 1;\n    const totalMessages = msgs.length;\n    /* participants array sorted by count */ const participants = Object.entries(counts).sort((a, b)=>b[1] - a[1]).map(([name, count])=>({\n            name,\n            count,\n            percentage: +(count / totalMessages * 100).toFixed(1)\n        }));\n    while(participants.length < 2)participants.push({\n        name: 'Unknown',\n        count: 0,\n        percentage: 0\n    });\n    /* chat period */ const startDate = msgs[0].ts;\n    const endDate = msgs[msgs.length - 1].ts;\n    /* simple metrics */ const daysActive = Math.max(1, (endDate.getTime() - startDate.getTime()) / 86400000);\n    const pingFreq = +(totalMessages / daysActive).toFixed(1);\n    const talkRatio = `${participants[0].percentage}:${participants[1].percentage}`;\n    const replyRhythm = 2.3 // TODO: real calc\n    ;\n    const bondOMeter = Math.min(100, Math.round(pingFreq * 4));\n    let label = 'Distant';\n    if (bondOMeter > 80) label = 'Best Friends';\n    else if (bondOMeter > 60) label = 'Close Friends';\n    else if (bondOMeter > 40) label = 'Just Friends';\n    const metrics = {\n        participants,\n        totalMessages,\n        chatPeriod: {\n            start: startDate.toISOString(),\n            end: endDate.toISOString()\n        },\n        pingFreq,\n        replyRhythm,\n        talkRatio,\n        bondOMeter,\n        label\n    };\n    /* 4. insert row in Postgres */ const insRes = await _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_2__.supabase.from('friendship_analyses').insert({\n        file_name: file.name,\n        metrics\n    }).select().single();\n    console.error('🔴 insert.error →', insRes.error);\n    if (insRes.error) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: insRes.error.message\n    }, {\n        status: 500\n    });\n    /* 5. return inserted row */ return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(insRes.data, {\n        status: 200\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFZLENBQUMsRUFBRSxDQUFDSSxVQUFVLEVBQUU7SUFDL0UsTUFBTVMsY0FBYyxJQUFJLGtCQUFrQjs7SUFDMUMsTUFBTUMsYUFBYUwsS0FBS2xDLEdBQUcsQ0FBQyxLQUFLa0MsS0FBS00sS0FBSyxDQUFDSixXQUFXO0lBRXZELElBQUlLLFFBQVE7SUFDWixJQUFJRixhQUFhLElBQUlFLFFBQVE7U0FDeEIsSUFBSUYsYUFBYSxJQUFJRSxRQUFRO1NBQzdCLElBQUlGLGFBQWEsSUFBSUUsUUFBUTtJQUVsQyxNQUFNQyxVQUFVO1FBQ2RqQjtRQUNBRDtRQUNBbUIsWUFBWTtZQUNWQyxPQUFPYixVQUFVYyxXQUFXO1lBQzVCQyxLQUFLZCxRQUFRYSxXQUFXO1FBQzFCO1FBQ0FUO1FBQ0FFO1FBQ0FEO1FBQ0FFO1FBQ0FFO0lBQ0Y7SUFFQSw2QkFBNkIsR0FDN0IsTUFBTU0sU0FBUyxNQUFNdkYseURBQVFBLENBQzFCYyxJQUFJLENBQUMsdUJBQ0wwRSxNQUFNLENBQUM7UUFBRUMsV0FBV3BGLEtBQUthLElBQUk7UUFBRWdFO0lBQVEsR0FDdkNRLE1BQU0sR0FDTkMsTUFBTTtJQUVUQyxRQUFRcEYsS0FBSyxDQUFDLHFCQUFxQitFLE9BQU8vRSxLQUFLO0lBRS9DLElBQUkrRSxPQUFPL0UsS0FBSyxFQUNkLE9BQU9WLHFEQUFZQSxDQUFDUyxJQUFJLENBQUM7UUFBRUMsT0FBTytFLE9BQU8vRSxLQUFLLENBQUNhLE9BQU87SUFBQyxHQUFHO1FBQUVaLFFBQVE7SUFBSTtJQUUxRSwwQkFBMEIsR0FDMUIsT0FBT1gscURBQVlBLENBQUNTLElBQUksQ0FBQ2dGLE9BQU9NLElBQUksRUFBRTtRQUFFcEYsUUFBUTtJQUFJO0FBQ3REIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGNoaXRyXFxEb3dubG9hZHNcXGZyaWVuZHNoaXAgYW5hbHl6ZXJcXGFwcFxcYXBpXFxhbmFseXplXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcclxuICAgL2FwcC9hcGkvYW5hbHl6ZS9yb3V0ZS50c1xyXG4gICBBY2NlcHRzIG11bHRpcGFydC9mb3Jt4oCRZGF0YSAoXCJmaWxlXCIgPSBXaGF0c0FwcCAuemlwKSxcclxuICAgdXBsb2FkcyB0byBTdXBhYmFzZSBTdG9yYWdlLCBwYXJzZXMgY2hhdCwgc3RvcmVzIG1ldHJpY3MsXHJcbiAgIGFuZCByZXR1cm5zIHRoZSBpbnNlcnRlZCByb3cuXHJcbiAgIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgCAqL1xyXG5cclxuaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJ1xyXG5pbXBvcnQgSlNaaXAgZnJvbSAnanN6aXAnXHJcbmltcG9ydCB7IHN1cGFiYXNlIH0gZnJvbSAnQC9saWIvc3VwYWJhc2VDbGllbnQnXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXE6IE5leHRSZXF1ZXN0KSB7XHJcbiAgLyogMS4gcmVhZCBmb3Jt4oCRZGF0YSAqL1xyXG4gIGNvbnN0IGZvcm0gPSBhd2FpdCByZXEuZm9ybURhdGEoKVxyXG4gIGNvbnN0IGZpbGUgPSBmb3JtLmdldCgnZmlsZScpIGFzIEZpbGUgfCBudWxsXHJcbiAgaWYgKCFmaWxlKVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdObyBmaWxlIHByb3ZpZGVkJyB9LCB7IHN0YXR1czogNDAwIH0pXHJcblxyXG4gIGNvbnN0IGJ1ZiA9IGF3YWl0IGZpbGUuYXJyYXlCdWZmZXIoKVxyXG5cclxuICAvKiAyLiB1cGxvYWQgcmF3IHppcCB0byBTdXBhYmFzZSBTdG9yYWdlICovXHJcbiAgY29uc3QgdXBSZXMgPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLnN0b3JhZ2VcclxuICAgIC5mcm9tKCd1cGxvYWRzJylcclxuICAgIC51cGxvYWQoYCR7RGF0ZS5ub3coKX1fJHtmaWxlLm5hbWV9YCwgYnVmLCB7IGNvbnRlbnRUeXBlOiBmaWxlLnR5cGUgfSlcclxuXHJcbiAgaWYgKHVwUmVzLmVycm9yKVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IHVwUmVzLmVycm9yLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KVxyXG5cclxuICAvKiAzLiB1bnppcCArIHJlYWQgY2hhdCB0eHQgKi9cclxuICBjb25zdCB6aXAgPSBhd2FpdCBKU1ppcC5sb2FkQXN5bmMoYnVmKVxyXG4gIGNvbnN0IHR4dE5hbWUgPSBPYmplY3Qua2V5cyh6aXAuZmlsZXMpLmZpbmQoKG4pID0+IG4uZW5kc1dpdGgoJy50eHQnKSlcclxuICBpZiAoIXR4dE5hbWUpXHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0NoYXQgLnR4dCBub3QgZm91bmQnIH0sIHsgc3RhdHVzOiA0MDAgfSlcclxuXHJcbiAgY29uc3QgY2hhdFR4dCA9IGF3YWl0IHppcC5maWxlc1t0eHROYW1lXS5hc3luYygnc3RyaW5nJylcclxuXHJcbiAgLyogLS0tLS0tLS0tLSAgUGFyc2UgJiBidWlsZCBtZXRyaWNzICAtLS0tLS0tLS0tICovXHJcblxyXG4gIGNvbnN0IGxpbmVSeCA9XHJcbiAgICAvXihcXGR7MSwyfSlcXC8oXFxkezEsMn0pXFwvKFxcZHsyLDR9KSwgKFxcZHsxLDJ9KTooXFxkezJ9KVxccz8oQU18UE0pPyAtIChbXjpdKyk6L1xyXG4gIHR5cGUgTXNnID0geyB0czogRGF0ZTsgYXV0aG9yOiBzdHJpbmcgfVxyXG4gIGNvbnN0IG1zZ3M6IE1zZ1tdID0gW11cclxuXHJcbiAgLyogaGVscGVyIHRvIGJ1aWxkIGEgRGF0ZSBzYWZlbHkgKEREL01NL1lZWVkgSEg6TU0gQU0vUE0pICovXHJcbiAgZnVuY3Rpb24gbWFrZURhdGUoXHJcbiAgICBkOiBudW1iZXIsXHJcbiAgICBtOiBudW1iZXIsXHJcbiAgICB5OiBudW1iZXIsXHJcbiAgICBoOiBudW1iZXIsXHJcbiAgICBtaW46IG51bWJlcixcclxuICAgIGFtcG0/OiBzdHJpbmdcclxuICApIHtcclxuICAgIGNvbnN0IHllYXIgPSB5IDwgMTAwID8gMjAwMCArIHkgOiB5XHJcbiAgICBsZXQgaG91ciA9IGhcclxuICAgIGlmIChhbXBtKSB7XHJcbiAgICAgIGlmIChhbXBtID09PSAnUE0nICYmIGggPCAxMikgaG91ciArPSAxMlxyXG4gICAgICBpZiAoYW1wbSA9PT0gJ0FNJyAmJiBoID09PSAxMikgaG91ciA9IDBcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgRGF0ZSh5ZWFyLCBtIC0gMSwgZCwgaG91ciwgbWluKVxyXG4gIH1cclxuXHJcbiAgY2hhdFR4dC5zcGxpdCgnXFxuJykuZm9yRWFjaCgocmF3KSA9PiB7XHJcbiAgICBjb25zdCBsaW5lID0gcmF3LnRyaW0oKVxyXG4gICAgY29uc3QgbSA9IGxpbmVSeC5leGVjKGxpbmUpXHJcbiAgICBpZiAoIW0pIHJldHVyblxyXG5cclxuICAgIGNvbnN0IFssIGRkLCBtbSwgeXksIGhoLCBtaW4sIGFtcG0sIGF1dGhvcl0gPSBtXHJcbiAgICBjb25zdCB0cyA9IG1ha2VEYXRlKCtkZCwgK21tLCAreXksICtoaCwgK21pbiwgYW1wbSlcclxuXHJcbiAgICBpZiAoIWlzTmFOKHRzLmdldFRpbWUoKSkpIG1zZ3MucHVzaCh7IHRzLCBhdXRob3IgfSlcclxuICB9KVxyXG5cclxuICBpZiAobXNncy5sZW5ndGggPCA1KVxyXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxyXG4gICAgICB7IGVycm9yOiAnTm90IGVub3VnaCBtZXNzYWdlcyBwYXJzZWQnIH0sXHJcbiAgICAgIHsgc3RhdHVzOiA0MDAgfVxyXG4gICAgKVxyXG5cclxuICAvKiBzb3J0IG1lc3NhZ2VzIGNocm9ub2xvZ2ljYWxseSAqL1xyXG4gIG1zZ3Muc29ydCgoYSwgYikgPT4gYS50cy5nZXRUaW1lKCkgLSBiLnRzLmdldFRpbWUoKSlcclxuXHJcbiAgLyogLS0tLS0tLS0tLSAgZXhpc3RpbmcgY29kZSBjb250aW51ZXMgYmVsb3cgIC0tLS0tLS0tLS0gKi9cclxuXHJcbiAgLyogY291bnQgbXNncyBwZXIgYXV0aG9yICovXHJcbiAgY29uc3QgY291bnRzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge31cclxuICBmb3IgKGNvbnN0IHsgYXV0aG9yIH0gb2YgbXNncykgY291bnRzW2F1dGhvcl0gPSAoY291bnRzW2F1dGhvcl0gfHwgMCkgKyAxXHJcbiAgY29uc3QgdG90YWxNZXNzYWdlcyA9IG1zZ3MubGVuZ3RoXHJcblxyXG4gIC8qIHBhcnRpY2lwYW50cyBhcnJheSBzb3J0ZWQgYnkgY291bnQgKi9cclxuICBjb25zdCBwYXJ0aWNpcGFudHMgPSBPYmplY3QuZW50cmllcyhjb3VudHMpXHJcbiAgICAuc29ydCgoYSwgYikgPT4gYlsxXSAtIGFbMV0pXHJcbiAgICAubWFwKChbbmFtZSwgY291bnRdKSA9PiAoe1xyXG4gICAgICBuYW1lLFxyXG4gICAgICBjb3VudCxcclxuICAgICAgcGVyY2VudGFnZTogKygoY291bnQgLyB0b3RhbE1lc3NhZ2VzKSAqIDEwMCkudG9GaXhlZCgxKSxcclxuICAgIH0pKVxyXG5cclxuICB3aGlsZSAocGFydGljaXBhbnRzLmxlbmd0aCA8IDIpXHJcbiAgICBwYXJ0aWNpcGFudHMucHVzaCh7IG5hbWU6ICdVbmtub3duJywgY291bnQ6IDAsIHBlcmNlbnRhZ2U6IDAgfSlcclxuXHJcbiAgLyogY2hhdCBwZXJpb2QgKi9cclxuICBjb25zdCBzdGFydERhdGUgPSBtc2dzWzBdLnRzXHJcbiAgY29uc3QgZW5kRGF0ZSA9IG1zZ3NbbXNncy5sZW5ndGggLSAxXS50c1xyXG5cclxuICAvKiBzaW1wbGUgbWV0cmljcyAqL1xyXG4gIGNvbnN0IGRheXNBY3RpdmUgPSBNYXRoLm1heChcclxuICAgIDEsXHJcbiAgICAoZW5kRGF0ZS5nZXRUaW1lKCkgLSBzdGFydERhdGUuZ2V0VGltZSgpKSAvIDg2XzQwMF8wMDBcclxuICApXHJcbiAgY29uc3QgcGluZ0ZyZXEgPSArKHRvdGFsTWVzc2FnZXMgLyBkYXlzQWN0aXZlKS50b0ZpeGVkKDEpXHJcbiAgY29uc3QgdGFsa1JhdGlvID0gYCR7cGFydGljaXBhbnRzWzBdLnBlcmNlbnRhZ2V9OiR7cGFydGljaXBhbnRzWzFdLnBlcmNlbnRhZ2V9YFxyXG4gIGNvbnN0IHJlcGx5Umh5dGhtID0gMi4zIC8vIFRPRE86IHJlYWwgY2FsY1xyXG4gIGNvbnN0IGJvbmRPTWV0ZXIgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQocGluZ0ZyZXEgKiA0KSlcclxuXHJcbiAgbGV0IGxhYmVsID0gJ0Rpc3RhbnQnXHJcbiAgaWYgKGJvbmRPTWV0ZXIgPiA4MCkgbGFiZWwgPSAnQmVzdCBGcmllbmRzJ1xyXG4gIGVsc2UgaWYgKGJvbmRPTWV0ZXIgPiA2MCkgbGFiZWwgPSAnQ2xvc2UgRnJpZW5kcydcclxuICBlbHNlIGlmIChib25kT01ldGVyID4gNDApIGxhYmVsID0gJ0p1c3QgRnJpZW5kcydcclxuXHJcbiAgY29uc3QgbWV0cmljcyA9IHtcclxuICAgIHBhcnRpY2lwYW50cyxcclxuICAgIHRvdGFsTWVzc2FnZXMsXHJcbiAgICBjaGF0UGVyaW9kOiB7XHJcbiAgICAgIHN0YXJ0OiBzdGFydERhdGUudG9JU09TdHJpbmcoKSxcclxuICAgICAgZW5kOiBlbmREYXRlLnRvSVNPU3RyaW5nKCksXHJcbiAgICB9LFxyXG4gICAgcGluZ0ZyZXEsXHJcbiAgICByZXBseVJoeXRobSxcclxuICAgIHRhbGtSYXRpbyxcclxuICAgIGJvbmRPTWV0ZXIsXHJcbiAgICBsYWJlbCxcclxuICB9XHJcblxyXG4gIC8qIDQuIGluc2VydCByb3cgaW4gUG9zdGdyZXMgKi9cclxuICBjb25zdCBpbnNSZXMgPSBhd2FpdCBzdXBhYmFzZVxyXG4gICAgLmZyb20oJ2ZyaWVuZHNoaXBfYW5hbHlzZXMnKVxyXG4gICAgLmluc2VydCh7IGZpbGVfbmFtZTogZmlsZS5uYW1lLCBtZXRyaWNzIH0pXHJcbiAgICAuc2VsZWN0KClcclxuICAgIC5zaW5nbGUoKVxyXG5cclxuICBjb25zb2xlLmVycm9yKCfwn5S0IGluc2VydC5lcnJvciDihpInLCBpbnNSZXMuZXJyb3IpXHJcblxyXG4gIGlmIChpbnNSZXMuZXJyb3IpXHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogaW5zUmVzLmVycm9yLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KVxyXG5cclxuICAvKiA1LiByZXR1cm4gaW5zZXJ0ZWQgcm93ICovXHJcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKGluc1Jlcy5kYXRhLCB7IHN0YXR1czogMjAwIH0pXHJcbn1cclxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsIkpTWmlwIiwic3VwYWJhc2UiLCJQT1NUIiwicmVxIiwiZm9ybSIsImZvcm1EYXRhIiwiZmlsZSIsImdldCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImJ1ZiIsImFycmF5QnVmZmVyIiwidXBSZXMiLCJzdG9yYWdlIiwiZnJvbSIsInVwbG9hZCIsIkRhdGUiLCJub3ciLCJuYW1lIiwiY29udGVudFR5cGUiLCJ0eXBlIiwibWVzc2FnZSIsInppcCIsImxvYWRBc3luYyIsInR4dE5hbWUiLCJPYmplY3QiLCJrZXlzIiwiZmlsZXMiLCJmaW5kIiwibiIsImVuZHNXaXRoIiwiY2hhdFR4dCIsImFzeW5jIiwibGluZVJ4IiwibXNncyIsIm1ha2VEYXRlIiwiZCIsIm0iLCJ5IiwiaCIsIm1pbiIsImFtcG0iLCJ5ZWFyIiwiaG91ciIsInNwbGl0IiwiZm9yRWFjaCIsInJhdyIsImxpbmUiLCJ0cmltIiwiZXhlYyIsImRkIiwibW0iLCJ5eSIsImhoIiwiYXV0aG9yIiwidHMiLCJpc05hTiIsImdldFRpbWUiLCJwdXNoIiwibGVuZ3RoIiwic29ydCIsImEiLCJiIiwiY291bnRzIiwidG90YWxNZXNzYWdlcyIsInBhcnRpY2lwYW50cyIsImVudHJpZXMiLCJtYXAiLCJjb3VudCIsInBlcmNlbnRhZ2UiLCJ0b0ZpeGVkIiwic3RhcnREYXRlIiwiZW5kRGF0ZSIsImRheXNBY3RpdmUiLCJNYXRoIiwibWF4IiwicGluZ0ZyZXEiLCJ0YWxrUmF0aW8iLCJyZXBseVJoeXRobSIsImJvbmRPTWV0ZXIiLCJyb3VuZCIsImxhYmVsIiwibWV0cmljcyIsImNoYXRQZXJpb2QiLCJzdGFydCIsInRvSVNPU3RyaW5nIiwiZW5kIiwiaW5zUmVzIiwiaW5zZXJ0IiwiZmlsZV9uYW1lIiwic2VsZWN0Iiwic2luZ2xlIiwiY29uc29sZSIsImRhdGEiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/analyze/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabaseClient.ts":
/*!*******************************!*\
  !*** ./lib/supabaseClient.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n/**\r\n * One shared Supabase client.\r\n *\r\n * It automatically reads the URL and anon key\r\n * from your `.env.local` environment file.\r\n */ const supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(\"https://rnvlslkwkcwpljerlctn.supabase.co\", \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudmxzbGt3a2N3cGxqZXJsY3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDc0NTIsImV4cCI6MjA2ODY4MzQ1Mn0.SkXWohbk_vqw8v3XdiISPTEqMEayLCdLueGVe2-NIa8\");\nconsole.log('Supabase URL ->', \"https://rnvlslkwkcwpljerlctn.supabase.co\");\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2VDbGllbnQudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBb0Q7QUFFcEQ7Ozs7O0NBS0MsR0FDTSxNQUFNQyxXQUFXRCxtRUFBWUEsQ0FDbENFLDBDQUFvQyxFQUNwQ0Esa05BQXlDLEVBQzFDO0FBQ0RJLFFBQVFDLEdBQUcsQ0FBQyxtQkFBbUJMLDBDQUFvQyIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxjaGl0clxcRG93bmxvYWRzXFxmcmllbmRzaGlwIGFuYWx5emVyXFxsaWJcXHN1cGFiYXNlQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcclxuXHJcbi8qKlxyXG4gKiBPbmUgc2hhcmVkIFN1cGFiYXNlIGNsaWVudC5cclxuICpcclxuICogSXQgYXV0b21hdGljYWxseSByZWFkcyB0aGUgVVJMIGFuZCBhbm9uIGtleVxyXG4gKiBmcm9tIHlvdXIgYC5lbnYubG9jYWxgIGVudmlyb25tZW50IGZpbGUuXHJcbiAqL1xyXG5leHBvcnQgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVDbGllbnQoXHJcbiAgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMISwgICAgICAvLyAg4oaQIHRoZSBcIiFcIiB0ZWxscyBUUyBpdCdzIGRlZmluZWRcclxuICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9BTk9OX0tFWSFcclxuKVxyXG5jb25zb2xlLmxvZygnU3VwYWJhc2UgVVJMIC0+JywgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMKVxyXG5cclxuIl0sIm5hbWVzIjpbImNyZWF0ZUNsaWVudCIsInN1cGFiYXNlIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZIiwiY29uc29sZSIsImxvZyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabaseClient.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fanalyze%2Froute&page=%2Fapi%2Fanalyze%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fanalyze%2Froute.ts&appDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=export&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fanalyze%2Froute&page=%2Fapi%2Fanalyze%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fanalyze%2Froute.ts&appDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=export&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_chitr_Downloads_friendship_analyzer_app_api_analyze_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/analyze/route.ts */ \"(rsc)/./app/api/analyze/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"export\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/analyze/route\",\n        pathname: \"/api/analyze\",\n        filename: \"route\",\n        bundlePath: \"app/api/analyze/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\chitr\\\\Downloads\\\\friendship analyzer\\\\app\\\\api\\\\analyze\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_chitr_Downloads_friendship_analyzer_app_api_analyze_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhbmFseXplJTJGcm91dGUmcGFnZT0lMkZhcGklMkZhbmFseXplJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYW5hbHl6ZSUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNjaGl0ciU1Q0Rvd25sb2FkcyU1Q2ZyaWVuZHNoaXAlMjBhbmFseXplciU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDY2hpdHIlNUNEb3dubG9hZHMlNUNmcmllbmRzaGlwJTIwYW5hbHl6ZXImaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9ZXhwb3J0JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQzZCO0FBQzFHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxjaGl0clxcXFxEb3dubG9hZHNcXFxcZnJpZW5kc2hpcCBhbmFseXplclxcXFxhcHBcXFxcYXBpXFxcXGFuYWx5emVcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiZXhwb3J0XCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2FuYWx5emUvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hbmFseXplXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hbmFseXplL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxcY2hpdHJcXFxcRG93bmxvYWRzXFxcXGZyaWVuZHNoaXAgYW5hbHl6ZXJcXFxcYXBwXFxcXGFwaVxcXFxhbmFseXplXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fanalyze%2Froute&page=%2Fapi%2Fanalyze%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fanalyze%2Froute.ts&appDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=export&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "?32c4":
/*!****************************!*\
  !*** bufferutil (ignored) ***!
  \****************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?66e9":
/*!********************************!*\
  !*** utf-8-validate (ignored) ***!
  \********************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/ws","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions","vendor-chunks/isows","vendor-chunks/jszip","vendor-chunks/pako","vendor-chunks/readable-stream","vendor-chunks/inherits","vendor-chunks/util-deprecate","vendor-chunks/string_decoder","vendor-chunks/safe-buffer","vendor-chunks/process-nextick-args","vendor-chunks/lie","vendor-chunks/isarray","vendor-chunks/immediate","vendor-chunks/core-util-is"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fanalyze%2Froute&page=%2Fapi%2Fanalyze%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fanalyze%2Froute.ts&appDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cchitr%5CDownloads%5Cfriendship%20analyzer&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=export&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();