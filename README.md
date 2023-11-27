# MMM-CalendarExt3Journal
Magic mirror module for presenting events as daily/weekly journal style.

## Screenshot
![screenshot1](https://raw.githubusercontent.com/MMRIZE/public_ext_storage/main/MMM-CalendarExt3Journal/screenshot.png)

![screenshot2](https://raw.githubusercontent.com/MMRIZE/public_ext_storage/main/MMM-CalendarExt3Journal/screenshot2.png)




## Features
### Main Features
- More detailed view of events by day/week with specific time ranges.
- locale-aware calendar
- customizing events: filtering, sorting, transforming
- multi-instance available. You don't need to copy and rename the module. Just add one more configuration in your `config.js`.


## Install OR Update
### Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/MMRIZE/MMM-CalendarExt3Journal
cd MMM-CalendarExt3Journal
npm install
git submodule update --init --recursive

```

> Usually, the last line is needless because it would be executed automatically in `npm install` , but many people forgot to execute `npm install`, so I'm exaggarating.

### Update
```sh
cd ~/MagicMirror/modules/MMM-CalendarExt3Journal
git pull
npm update
```


### Not working?
When some `submodule` seems not installed and updated properly, try this.
```sh
cd ~/MagicMirror/modules/MMM-CalendarExt3Journal
git submodule update --init --recursive
```


## Config
Anyway, even this simplest will work.
```js
{
  module: "MMM-CalendarExt3Journal",
  position: "bottom_bar",
},

```

More conventional;
```js
{
  module: "MMM-CalendarExt3Journal",
  position: "bottom_bar",
  config: {
    height: '50vh',
    width: '100%',
    locale: 'en-GB',
    staticWeek: true,
    staticTime: true,
    hourLength: 9,
    beginHour:  8,
    calendarSet: ['us_holiday', 'EPL'],
  }
},
```

You need to setup the default `calendar` configuration also.
```js
/* default/calendar module configuration */
{
  module: "calendar",
  position: "top_left",
  config: {
    broadcastPastEvents: true, // <= IMPORTANT to see past events
    calendars: [
      {
        url: "webcal://www.calendarlabs.com/ical-calendar/ics/76/US_Holidays.ics",
        name: "us_holiday", // <= RECOMMENDED to assign name
        color: "red" // <= RECOMMENDED to assign color
      },
      ...

```

### Config details
All the properties are omittable, and if omitted, a default value will be applied.

|**property**|**default**|**description**|
|---|---|---|
|`height` | '800px' | The height of the module. |
|`width` | '100%' | The width of the module. |
|`instanceId` | (auto-generated) | When you want more than 1 instance of this module, each instance would need this value to distinguish each other. If you don't assign this property, the `identifier` of the module instance will be assigned automatically but not recommended to use it. (Hard to guess the auto-assigned value.)|
|`calendarSet` | [] | When you want to display only selected calendars, fulfil this array with the targeted calendar name(of the default `calendar` module). <br>e.g) `calendarSet: ['us_holiday', 'office'],`<br> `[]` or `null` will allow all the calendars. |
|`locale` | (`language` of MM config) | e.g. `de` or `ko-KR` or `ja-Jpan-JP-u-ca-japanese-hc-h12`. It defines how to handle and display your date-time values by the locale. When omitted, the default `language` config value of MM. |
|`staticWeek` | false | if `true`, the view will show 1 week's view forcely. (from the start of the week to the end of the week. Usually It will be Mon~Sun or Sun~Sat by locale)<br> If `true`, the `dayIndex` and `days` attributes will be ignored.
|`dayIndex`| 0 | Which day starts in the view. `-1` means yesterday, `2` means the next day of tomorrow. Today is `0`|
|`days`| 3 | How many days will be shown from `dayIndex`. `1` means just a day.|
|`staticTime` | true | If `true`, the view will show the events from `beginHour` to `beginHour + hourLength`. <br> If `false`, the view will show the events from `this hour + beginHour` for `hourLength`. <br> Details are explained below later.|
|`beginHour` | 8 | The view frame starts from this hour (relatively or statically) |
|`hourLength` | 4 | How many hours the view has. |
|`hourIndexOptions` | {hour: 'numeric', minute: '2-digit'} | The format of hour index time. It varies by the `locale` and this option. <br>With `locale:'en-GB'`, isplaying will be `12:00`. <br> See [options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) |
|`dateHeaderOptions` | {day: 'numeric', weekday: 'short'} | The format of each day header. It varies by the `locale` and this option. <br>With `locale:'en-GB'`, displaying will be `SUN 25`. <br> See [options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) |
|`eventTimeOptions` | {timeStyle 'short'} | The format of each event. It varies by the `locale` and this option. <br>With `locale:'en-GB'`, displaying will be `12:34`. <br> See [options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters) |
|`eventFilter`| callback function | See the `Filtering` part.|
|`eventSorter`| callback function | See the `Sorting` part.|
|`eventTransformer`| callback function | See the `Transforming` part.|
|`preProcessor` | callback function | See the `preProcessing` part. |
|`waitFetch`| 5000 | (ms) waiting the fetching of last calendar to prevent flickering view by too frequent fetching. |
|`refreshInterval`| 600000 | (ms) refresh view by force if you need it. |
|`animationSpeed` | 1000 | (ms) Refreshing the view smoothly. |
|`useSymbol` | true | Whether to show font-awesome symbold instead of simple dot icon. |
|`useIconify` | false | If set `true`, You can use `iconify-icon` instead of `fontawesome`. |
|`weekends` | (auto-filled by locale) |(Array of day order). e.g. `weekends: [1, 3]` means Monday and Wedneseday would be regarded as weekends. Usually you don't have to set this value. <br> **Auto-filled by locale unless you set manually.** |
|`firstDayOfWeek`| (auto-filled by locale) | Monday is the first day of the week according to the international standard ISO 8601, but in the US, Canada, Japan and some cultures, it's counted as the second day of the week. If you want to start the week from Monday, set this property to `1`. If you want Sunday, set `0`. <br> Sunday:0, Monday:1, Tuesday:2, ..., Saturday:6 <br> **Auto-filled by locale unless you set manually.** |
|`minimalDaysOfNewYear` | (auto-filled by locale) | ISO 8601 also says **each week's year is the Gregorian year in which the Thursday falls**. The first week of the year, hence, always contains 4 January. However, the US (Yes, it is.) system differs from standards. In the US, **containing 1 January** defines the first week. In that case, set this value to `1`. And under some other culture, you might need to modify this. <br> **Auto-filled by locale unless you set manually.** |


## Notification
### Incoming Notifications
#### `CX3J_CONFIG`, payload: {config}
- The current configuration value would be overridden by the receiving payload.
- For example; the current config might be;
```js
config: {
  ...
  staticTime: true,
  beginhHour: 8,
  hourLength: 8,
  calendarSet: ['office', 'family'],
  ...
}
```
When some external notification like below comes;
```js
.sendNotification('CX3J_CONFIG', { calendarSet: ['EPL'], beginHour: 16 })
```
Then, the view will be changed with those attributes. The unmentioned values would remain as before.

#### `CX3J_RESET`
Return to the original config value .

> I think these 2 notifications would be enough to control the module's view. This approach is a new way for my all CX3* modules. I'll change other CX3* modules in this way later.

### Outgoing Notification
Nothing yet.  (Does it need?)

## Styling with CSS
You can handle almost all of the visual things with CSS. See the `MMM-CalendarExt3Journal.css` and override your needs into your `custom.css`.
- `CX3J`, `CX3J_{instanceId}`, `.bodice` : The root selector. Each instance of this module will have `CX3J_{instanceId}` as another root selector. With this CSS selector, you can assign individual looks to each instance.

```css
.CX3J {
  --moduleHeight: 800px;
  --moduleWidth: 100%;
  --indexWidth: 60px;
  --eventHeight: 16px;
  --borderSize: 1px;
  --mainBorderStyle: var(--borderSize) solid darkgray;
  --subBorderStyle: var(--borderSize) dotted darkslategray;
}
```
The most commonly used values would be defined in `.CX3J` selector as variables. 
- `moduleHeight` and `-moduleWidth` will be set by configuration value `height` and `width` for your convenience.


## Handling Events
Each event object has this structure.
```json
{
  "title": "Leeds United - Chelsea",
  "startDate": 1650193200000,
  "endDate": 1650199500000,
  "fullDayEvent": false,
  "class": "PUBLIC",
  "location": false,
  "geo": false,
  "description": "...",
  "today": false,
  "symbol": ["calendar-alt"],
  "calendarName": "tottenham",
  "color": "gold",
  "calendarSeq": 1, // This would be the order from `calendarSet` of configuration
  "isPassed": true,
  "isCurrent": false,
  "isFuture": false,
  "isFullday": false,
  "isMultiday": false,
  "skip": false, // If this is set, event will not be rendered. (since 1.7.0)
}
```
You can use these values to handle events.

### Filtering
You can filter each event by its condition.
```js
eventFilter: (ev) => {
  if (ev.isFullday) return false
  return true
}
```
This example shows how you can filter out 'fullday' events.

### Sorting
You can sort each event by its condition. However, this module arranges events masonry with density. So displaying would not fit with your sorting intention. Anyway, try if you need it.
```js
eventSorter: (a, b) => {
  return a.calendarSeq - b.calendarSeq
}
```
This example tries to sort events by calendar order in `calendarSet`.

### Transforming
You can manipulate or change the properties of the event.
```js
eventTransformer: (ev) => {
  if (ev.title.search('John') > -1) ev.color = 'blue'
  return ev
}
```
This example shows how you can transform the color of events when the event title has specific text.

### preProcessing
```js
preProcessor: (ev) => {
  if (ev.title.includes('test')) return null
  if (ev.calendarName === 'Specific calendar') ev.startDate += 2 * 60 * 60 * 1000
  return ev
}
```
This example shows 

1) if the title of an event has "test", drop the event off

2) then add 2 hours to the start time of events on the specific calendar.

Unlike eventTransformer, the preProcessor would be applied to raw data format of events from the default calendar module or equivalent after receiving notification. 

This is the better place to adjust the event itself to make it compatible with this module before the main logic of the module handle and regularize events.


### skip to draw
if an `evnet` has `.skip: true` attribute as a property, this event will not be rendered on the screen. However, it will remain in the data, so you can sort, filter or use that event. 

Generally, this attribute will not derived from the original calendar provider(e.g. default calendar module). You may need to assign the value by yourself with event-handling.

### using `iconify`.
Even though `fontawesome` is the default icon framework of MM, there are many needs of `iconify`. And I prefer it to font-awesome. Now you can use iconify icons by config value `useIconify: true`
```js
// In your calendar module config
defaultSymbolClassName: '', // <-- Important to identify iconify properly.
calendars: [
  {
    color: "red",
    symbol: "flag:us-4x3",
    url: "https://ics.calendarlabs.com/76/mm3137/US_Holidays.ics"
  },
  {
    color: "red",
    symbol: "fa fa-fw fa-flag",
    url: "https://ics.calendarlabs.com/76/mm3137/US_Holidays.ics"
  },
],
```

**WARNING** 
To use `iconify`, you should set `defaultSymbolClassName: '',` in your default calendar module. Ususally, it is enough when you hide the original default calendar module to use with CX3*. But if you want to use font-awesome icons together, you should add font-awesome class names (e.g `fa`, `fas`, `fa-calendar-check`...) by yourself.


## Not the bug, but...
- The default `calendar` module cannot emit the exact starting time of `multidays-fullday-event which is passing current moment`. Always it starts from today despite of original event starting time. So this module displays these kinds of multidays-fullday-event weirdly.


## Latest Updates
### 1.0.0 (2023-11-27)
- Released.


## More Info.
- Discussion board: https://github.com/MMRIZE/MMM-CalendarExt3Journal/discussions
- Bug Report: https://github.com/MMRIZE/MMM-CalendarExt3Journal/issues
- Examples, Tips, and other info WIKI: https://github.com/MMRIZE/MMM-CalendarExt3Journal/wiki


## Siblings
- [MMM-CalendarExt3](https://github.com/MMRIZE/MMM-CalendarExt3)
- [MMM-CalendarExt3Agenda](https://github.com/MMRIZE/MMM-CalendarExt3Agenda)
- [MMM-CalendarExt3Timeline](https://github.com/MMRIZE/MMM-CalendarExt3Timeline)
- [MMM-CalendarExt3Journal](https://github.com/MMRIZE/MMM-CalendarExt3Journal)


## Author
- Seongnoh Yi (eouia0819@gmail.com)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y56IFLK)

