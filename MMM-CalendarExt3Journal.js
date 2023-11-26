Module.register('MMM-CalendarExt3Journal', {
  defaults: {
    height: '800px',
    width: '100%',
    instanceId: null,
    locale: null,
    staticWeek: false,
    dayIndex: 0,
    days: 3,
    staticTime: true,
    beginHour: 8,
    hourLength: 4,
    hourIndexOptions: {
      hour: 'numeric',
      minute: '2-digit',
    },
    dateHeaderOptions: {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    },
    eventDateOptions: {
      dateStyle: 'short',
    },
    eventTimeOptions: {
      timeStyle: 'short',
    },
    refreshInterval: 1000 * 60 * 10,
    waitFetch: 1000 * 5,
    animationSpeed: 100,
    animatedIn: null,
    animatedOut: null,
    calendarSet: [],
    eventFilter: null,
    eventTransformer: null,
    preProcessor: null,
    useSymbol: true,
    notification: 'CALENDAR_EVENTS',
    maxIntersect: 3, // max number of events to show in a column
    displayLegend: false,
    firstDayOfWeek: null,
    minimalDaysOfNewYear: null,
    weekends: [],
    useIconify: false,
  },


  getStyles: function () {
    return [ 'MMM-CalendarExt3Journal.css' ]
  },

  start: function () {
    this.nowTimer = null
    this.config.locale = Intl.getCanonicalLocales(this.config.locale ?? config.language )?.[0] ?? 'en-US'
    this.config.instanceId = this.config?.instanceId ?? this.identifier
    this.config.hourLength = Math.ceil((this.config.hourLength <= 1) ? 6 : this.config.hourLength)
    this._ready = false
    if (this.config.staticWeek) {
      this.config.days = 7
      this.config.dayIndex = 0
    }

    const calInfo = new Intl.Locale(this.config.locale)
    if (!calInfo?.weekInfo) Log.log('[CX3J] WeekInfo is not available in Intl.Locale, You may need to fulfill `firstDayOfWeek`, `minimalDaysOfNewYear` and `weekends` manually.')
    this.config.firstDayOfWeek = ((this.config.firstDayOfWeek !== null) ? this.config.firstDayOfWeek : (calInfo?.weekInfo?.firstDay ?? 1)) % 7
    this.config.minimalDaysOfNewYear = (this.config.minimalDaysOfNewYear !== null) ? this.config.minimalDaysOfNewYear : (calInfo?.weekInfo?.minimalDays ?? 4)
    this.config.weekends = ((Array.isArray(this.config.weekends) && this.config.weekends?.length) ? this.config.weekends : (calInfo?.weekInfo?.weekend ?? [])).map(d => d % 7)


    this.activeConfig = { ...this.config }
    this.originalConfig = { ...this.activeConfig }
    let _moduleLoaded = new Promise((resolve, reject) => {
      import('/' + this.file('CX3_Shared/CX3_shared.mjs')).then((m) => {
        this.library = m
        this.library.initModule(this, config.language)
        if (this.config.useIconify) this.library.prepareIconify()
        resolve()
      }).catch((err) => {
        Log.error(err)
        reject(err)
      })
    })

    let _firstData = new Promise((resolve, reject) => {
      this._receiveFirstData = resolve
    })

    let _firstFetched = new Promise((resolve, reject) => {
      this._firstDataFetched = resolve
    })

    let _domCreated = new Promise((resolve, reject) => {
      this._domReady = resolve
    })

    Promise.allSettled([ _moduleLoaded, _firstData, _domCreated ]).then((result) => {
      this._ready = true
      this.library.prepareMagic()
      let { payload, sender } = result[ 1 ].value
      this.fetch(payload, sender)
      this._firstDataFetched()
    })

    Promise.allSettled([ _firstFetched ]).then(() => {
      setTimeout(() => {
        this.updateView({ ...this.activeConfig })
      }, this.config.waitFetch)

    })
  },


  notificationReceived: function(notification, payload, sender) {
    if (notification === this.config.notification) {
      if (this?.storedEvents?.length == 0 && payload.length > 0) {
        this._receiveFirstData({payload, sender})
      }
      if (this?.library?.loaded) {
        this.fetch(payload, sender)
      } else {
        Log.warn('[CX3J] Module is not prepared yet, wait a while.')
      }
    }

    if (notification === 'DOM_OBJECTS_CREATED') {
      this._domReady()
    }

    if (notification === 'CX3J_CONFIG') {
      this.activeConfig = { ...this.activeConfig, ...payload }
      this.updateView({ ...this.activeConfig })
    }

    if (notification === 'CX3J_RESET') {
      this.activeConfig = { ...this.originalConfig }
      this.updateView({ ...this.activeConfig })
    }
  },

  fetch: function(payload, sender) {
    this.storedEvents = this.library.regularizeEvents({
      eventPool: this.eventPool,
      payload,
      sender,
      config: this.config
    })
  },

  updateView: function (options) {
    clearTimeout(this.timer)
    this.timer = null
    this.updateDom(this.config.animationSpeed)

    if (options?.refreshInterval) {
      this.timer = setTimeout(() => {
        this.updateView(options)
      }, options.refreshInterval)
    }
  },

  getDom: function() {
    let dom = document.createElement('div')
    dom.classList.add('bodice', 'CX3J_' + this.activeConfig.instanceId, 'CX3J')
    dom.style.setProperty('--moduleHeight', this.activeConfig.height)
    dom.style.setProperty('--moduleWidth', this.activeConfig.width)
    dom = this.drawBoard(dom, this.activeConfig)

    return dom
  },

  drawBoard: function (dom, options) {
    if (!this.library?.loaded) return dom

    const { getBeginOfWeek, isToday, isThisMonth, isThisYear, isWeekend } = this.library
    const { beginHour, staticWeek, dayIndex, days, staticTime, hourLength } = options
    let today = new Date()

    let startDay = (staticWeek)
    ? getBeginOfWeek(today, options)
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayIndex)
    let startHour = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate(),
      (staticTime) ? beginHour : today.getHours() + beginHour,
    )

    const board = document.createElement('div')
    board.classList.add('board')
    board.style.setProperty('--days', days)

    const headerContainer = document.createElement('div')
    headerContainer.classList.add('headerContainer')
    headerContainer.style.setProperty('--days', days)

    const headerBackground = document.createElement('div')
    headerBackground.classList.add('headerBackground')
    for (let i = 0; i < days; i++) {
      let daybackground = document.createElement('div')
      daybackground.classList.add('dayBackground')
      headerBackground.appendChild(daybackground)
    }

    headerContainer.appendChild(headerBackground)


    const header = document.createElement('div')
    header.classList.add('header')
    for (let i = 0; i < days; i++) {
      let day = new Date(startDay.valueOf())
      day.setDate(day.getDate() + i)
      let dayDom = document.createElement('div')
      dayDom.classList.add('daycell')
      if (isToday(day)) dayDom.classList.add('today')
      if (isThisMonth(day)) dayDom.classList.add('thisMonth')
      if (isThisYear(day)) dayDom.classList.add('thisYear')
      const weekends = isWeekend(day, options)
      if (weekends > -1) dayDom.classList.add('weekend', 'weekend_' + (weekends + 1))

      dayDom.dataset.isoString = day.toISOString()
      dayDom.dataset.date = day.valueOf()
      dayDom.innerHTML = new Intl.DateTimeFormat(options.locale, options.dateHeaderOptions).formatToParts(day)
        .reduce((prev, cur, curIndex, arr) => {
        prev = prev + `<span class="dayTimeParts ${cur.type} seq_${curIndex}">${cur.value}</span>`
        return prev
      }, '')
      header.appendChild(dayDom)
    }

    const feSection = document.createElement('div')
    feSection.classList.add('fulldayEvents')

    header.appendChild(feSection)
    headerContainer.appendChild(header)
    board.appendChild(headerContainer)


    const main = document.createElement('div')
    main.classList.add('main')
    main.style.setProperty('--periods', hourLength * 2)

    const halfHour = 30

    const now = [ today.getHours(), (today.getMinutes() < halfHour) ? true : false ]
    for (let i = 0; i < (hourLength * 2); i++) {
      let even = (i % 2 === 0)
      let pm = new Date(startHour.getTime())
      pm.setMinutes(startHour.getMinutes() + (i * halfHour))
      const current = (pm.getHours() === now[ 0 ] && even === now[ 1 ])
      const index = document.createElement('div')
      index.classList.add('index', 'gridCell', (even) ? 'even' : 'odd', (current) ? 'now' : 'notnow')
      index.innerHTML = new Intl.DateTimeFormat(options.locale, options.hourIndexOptions).formatToParts(pm)
      .reduce((prev, cur, curIndex, arr) => {
        prev = prev + `<span class="indexTimeParts ${cur.type} seq_${curIndex} ${cur.type}">${cur.value}</span>`
        return prev
      }, '')
      index.dataset.isoString = pm.toISOString()
      index.dataset.hour = pm.getHours()
      index.dataset.minute = pm.getMinutes()
      main.appendChild(index)

      for (let j = 0; j < days; j++) {
        let cm = new Date(pm.valueOf())
        cm.setDate(cm.getDate() + j)
        let cell = document.createElement('div')
        cell.classList.add('cell', 'gridCell', (even) ? 'even' : 'odd', (current) ? 'now' : 'notnow')
        cell.dataset.isoString = cm.toISOString()
        main.appendChild(cell)
      }
    }

    const drawNowIndicator = (main, options) => {
      clearTimeout(this.nowTimer)
      this.nowTimer = null
      let nowHeight = 0;
      let nowIndicator = main.querySelector('.nowIndicator')
      if (!nowIndicator) {
        nowIndicator = document.createElement('div')
        nowIndicator.classList.add('nowIndicator')
        main.appendChild(nowIndicator)
      }

      const now = new Date()

      const rangeStartHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour.getHours())
      const rangeEndHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour.getHours() + hourLength)
      const rangeStartHourValue = rangeStartHour.valueOf()
      const rangeEndHourValue = rangeEndHour.valueOf()
      nowIndicator.classList.add('nowIndicator')
      if (now.valueOf() < rangeStartHourValue) {
        nowHeight = 0
      } else if (now.valueOf() > rangeEndHourValue) {
        nowHeight = 100
      } else {
        nowHeight = (now.valueOf() - rangeStartHourValue) / (rangeEndHourValue - rangeStartHourValue) * 100
      }
      nowIndicator.style.setProperty('--nowHeight', nowHeight + '%')
      nowIndicator.dataset.time = new Intl.DateTimeFormat(options.locale, options.eventTimeOptions).format(now)

      this.nowTimer = setTimeout(() => {
        drawNowIndicator(main, options)
      }, 1000 * 10)
    }

    drawNowIndicator(main, options)


    board.appendChild(main)

    dom.appendChild(board)
    this.drawEvents(dom, options, { startDay, startHour })
    return dom
  },

  drawEvents: function (dom, options, startObj) {
    if (!this.storedEvents?.length || !this.library?.loaded) return dom
    const { fullday, single } = this.regularize(this.storedEvents, options, startObj)
    const { renderEventJournal, renderEventAgenda } = this.library
    const periods = Array.from(dom.querySelectorAll('.cell')).map(cell => cell.dataset.isoString)
    for (let event of single) {
      let startPoint = new Date(+event.vStartDate)
      startPoint.setMinutes((startPoint.getMinutes() < 30) ? 0 : 30)
      startPoint.setSeconds(0)
      startPoint.setMilliseconds(0)
      let matchedPeriod = periods.find(period => period === startPoint.toISOString())
      if (!matchedPeriod) continue
      let cell = dom.querySelector(`.cell[data-iso-string="${matchedPeriod}"]`)
      if (!cell) continue

      let cellDate = new Date(matchedPeriod)
      let height = event.vDuration / (1000 * 60 * 30)
      let eDom = renderEventJournal(event, options, cellDate)
      eDom.classList.add('single')
      eDom.style.setProperty('--eventHeight', height)
      eDom.style.setProperty('--eventTop', (((new Date(+event.vStartDate)).getMinutes() % 30) / 30 * 100) + "%")
      eDom.style.setProperty('--intersect', event.intersect)
      if (event?.continueFromPrev) eDom.classList.add('continueFromPrev')
      if (event?.continueToNext) eDom.classList.add('continueToNext')
      cell.appendChild(eDom)
      // ???
    }

    const dateRange = Array.from(dom.querySelectorAll('.daycell')).map((cell, index) => {
      const t = new Date(+cell.dataset.date)
      return {
        index,
        date: new Date(t.getFullYear(), t.getMonth(), t.getDate())
      }
    })

    const fsDom = dom.querySelector('.fulldayEvents')
    for (let event of fullday) {
      let startDate = new Date(+event.startDate)
      let endDate = new Date(+event.endDate)
      let startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      let endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      let startIndex = (dateRange.find((d) => d.date.valueOf() === startDay.valueOf())?.index ?? 0) + 1
      let endIndex = (dateRange.find((d) => d.date.valueOf() === endDay.valueOf())?.index ?? -3) + 2
      if (startIndex === endIndex) endIndex++
      let eDom = renderEventAgenda(event, options)
      eDom.classList.add('notsingle')
      eDom.style.setProperty('--eventStart', startIndex)
      eDom.style.setProperty('--eventEnd', endIndex)
      fsDom.appendChild(eDom)
    }
    return dom
  },

  regularize: function (events, options, { startDay, startHour }) {
    const { eventsByDate, prepareEvents, calendarFilter } = this.library

    const startDateWindow = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate())
    const endDateWindow = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + options.days)
    const prepared = prepareEvents({
      storedEvents: calendarFilter(events, options.calendarSet),
      config: options,
      range: [ startDateWindow.valueOf(), endDateWindow.valueOf() ],
    })

    const [ fulldayEvents, singleEvents ] = prepared.reduce(([ fulldayEvents, singleEvents ], event) => { // eslint-disable-line no-unused-vars
      if (event.isFullday || event.isMultiday) {
        fulldayEvents.push({ ...event })
      } else {
        singleEvents.push({ ...event })
      }
      return [ fulldayEvents, singleEvents ]
    }, [ [], [] ])

    const result = eventsByDate({
      storedEvents: singleEvents,
      config: options,
      startTime: startDay,
      dayCounts: options.days,
    })
    let regularized = []
    for (let { date, events } of result) {
      const singleRanged = []
      let day = new Date(date)
      let rangeStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour.getHours())
      let rangeEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour.getHours() + options.hourLength)
      events.forEach((orev) => {
        const event = { ...orev }
        if (event.isFullday) return
        let startDate = new Date(+event.startDate)
        let endDate = new Date(+event.endDate)
        if (startDate.valueOf() >= rangeEnd.valueOf() || endDate.valueOf() <= rangeStart.valueOf()) return

        if (startDate.valueOf() < rangeStart.valueOf()) {
          event.vStartDate = rangeStart.valueOf()
          event.continueFromPrev = true
        } else {
          event.vStartDate = event.startDate
        }
        if (endDate.valueOf() > rangeEnd.valueOf()) {
          event.vEndDate = rangeEnd.valueOf()
          event.continueToNext = true
        } else {
          event.vEndDate = event.endDate
        }
        event.vDuration = +event.vEndDate - +event.vStartDate
        event.intersect = 0
        singleRanged.push({ ...event })
      })
      singleRanged.sort((a, b) => {
        // sort by 'duration' desc first then 'startDate' asc
        if (a.vStartDate > b.vStartDate) return 1
        if (a.vStartDate < b.vStartDate) return -1
        if (a.vEndDate > b.vEndDate) return 1
        if (a.vEndDate < b.vEndDate) return -1
        return 0
      })
      for (let i = 0; i < singleRanged.length; i++) {
        let event = singleRanged[ i ]
        for (let j = i + 1; j < singleRanged.length; j++) {
          let compare = singleRanged[ j ]
          if (compare.vStartDate >= event.vEndDate || compare.vEndDate <= event.vStartDate) continue
          compare.intersect++
        }
      }
      regularized = [ ...regularized, ...singleRanged ]
    }

    return {
      fullday: fulldayEvents,
      single: regularized,
    }
  }
})