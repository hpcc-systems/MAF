/* global chartData */
;(() => {
    const rootURL = new URL('../../', document.currentScript.src)

    function element(tag, className, text) {
        const node = document.createElement(tag)
        node.className = className
        if (text !== undefined) node.textContent = text
        return node
    }

    function details(title, className) {
        const node = element('details', className)
        node.append(element('summary', '', title))
        return node
    }

    function parseJSON(text) {
        try {
            return { parsed: true, value: JSON.parse(text) }
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error
            return { parsed: false }
        }
    }

    function isRecord(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value)
    }

    function setLog(trigger, name, value) {
        trigger.dataset.attachmentType = 'log'
        trigger.dataset.attachmentName = name
        trigger.dataset.attachmentContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        trigger.querySelector('span').textContent = name
    }

    function isLegacyLog(log) {
        return /^(Log|JSON)\s*-?\s*\d+$/.test(log.trigger.dataset.attachmentName)
    }

    function formatLegacyLogs(group) {
        const logs = [...group.querySelectorAll('.modal-trigger[data-attachment-type="log"]')]
            .map(trigger => ({ trigger, ...parseJSON(trigger.dataset.attachmentContent) }))
        const exchange = logs.find(log => {
            const value = log.value?.lastRun
            return isLegacyLog(log) && isRecord(log.value) && Object.keys(log.value).length === 1
                && isRecord(value) && isRecord(value.request)
                && typeof value.request.method === 'string'
                && typeof value.request.absoluteUrl === 'string'
                && Number.isInteger(value.status) && Object.hasOwn(value, 'response')
                && typeof value.curlCommand === 'string' && typeof value.ok === 'boolean'
        })

        if (exchange) {
            const api = exchange.value.lastRun
            const values = [
                [`Request (${api.request.method})`, api.request],
                [`Response body (HTTP ${api.status})`, api.response],
                ['Response headers', api.headers]
            ]
            if (typeof api.curlCommand === 'string') values.push(['cURL command', api.curlCommand])
            for (const [name, value] of values) {
                if (value === undefined) continue
                const trigger = exchange.trigger.cloneNode(true)
                setLog(trigger, name, value)
                exchange.trigger.before(trigger)
            }
            exchange.trigger.remove()
            for (const log of logs) {
                if (isLegacyLog(log) && isRecord(log.value) && Object.keys(log.value).length === 1
                    && Object.hasOwn(log.value, 'response')
                    && JSON.stringify(log.value.response) === JSON.stringify(api.response)) {
                    log.trigger.remove()
                }
            }
        }

        for (const log of logs) {
            if (!log.trigger.isConnected || !log.parsed) continue
            if (isLegacyLog(log)
                && isRecord(log.value) && Object.keys(log.value).length === 1) {
                const [key] = Object.keys(log.value)
                setLog(log.trigger, key === 'lastRun' ? 'Step result' : `Value: ${key}`, log.value[key])
            } else {
                log.trigger.dataset.attachmentContent = JSON.stringify(log.value, null, 2)
            }
        }
    }

    function compactLayout() {
        document.body.classList.add('maf-report')
        const content = document.querySelector('main > div > div')
        const sources = window.MAFReport.sourceFiles
        const actions = element('div', 'maf-report-actions')
        const originals = details('Download Cucumber JSON', 'maf-originals')
        const links = element('div', 'maf-original-links')
        for (const file of sources) {
            const link = element('a', '', file)
            link.href = new URL(encodeURIComponent(file), rootURL).href
            link.download = file
            links.append(link)
        }
        originals.append(links)
        actions.append(originals)
        content.prepend(actions)

        const chartRows = [...content.children].filter(child => child.querySelector('[id$="-chart"]'))
        const analytics = details('Charts and performance', 'maf-analytics')
        analytics.append(...chartRows)
        analytics.addEventListener('toggle', () => {
            if (analytics.open) window.dispatchEvent(new Event('resize'))
        })

        if (document.getElementById('features-table-container')) {
            const nativeRunInfo = [...content.children].find(child => child.classList.contains('bg-card'))
            const runInfo = details('Run environment and build details', 'maf-run-info')
            runInfo.append(nativeRunInfo)
            const counts = chartData.scenarios
            const total = ['passed', 'failed', 'ambiguous', 'notDefined', 'pending', 'skipped']
                .reduce((sum, status) => sum + counts[status], 0)
            const needsAttention = counts.failed + counts.ambiguous + counts.notDefined
            const metrics = element('div', 'maf-metrics')
            const cards = [
                ['Features', chartData.features.length, ''],
                ['Scenarios', total, ''],
                ['Passed', counts.passed, 'maf-metric-passed'],
                ['Need attention', needsAttention, needsAttention ? 'maf-metric-failed' : '']
            ]
            for (const [label, value, state] of cards) {
                const card = element('div', `maf-metric ${state}`)
                card.append(element('span', 'maf-metric-label', label), element('strong', '', value))
                metrics.append(card)
            }
            actions.after(metrics, runInfo)
        } else {
            const featureHeader = [...content.children].find(child => child.classList.contains('bg-card'))
            featureHeader.classList.add('maf-feature-header')
            const toolbar = document.getElementById('scenarios-container').parentElement.firstElementChild
            toolbar.classList.add('maf-scenario-toolbar')
            toolbar.querySelector('.status-filter').parentElement.classList.add('maf-status-filters')
        }
        content.append(analytics)
    }

    function improveAttachments() {
        const groups = new Set([...document.querySelectorAll('.modal-trigger:not([data-attachment-type="error"])')]
            .map(trigger => trigger.parentElement.parentElement))
        for (const group of groups) {
            group.classList.add('maf-attachments')
            formatLegacyLogs(group)
        }

        for (const trigger of document.querySelectorAll('.modal-trigger')) {
            trigger.setAttribute('role', 'button')
            trigger.setAttribute('tabindex', '0')
            trigger.setAttribute('aria-label', trigger.dataset.attachmentName)
            trigger.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    trigger.click()
                }
            })
            if (trigger.dataset.attachmentType === 'error') continue
            const grid = trigger.parentElement
            grid.classList.add('maf-attachment-chips')
            // The reporter does not add step context to JSON attachments yet.
            if (!trigger.dataset.stepContext) {
                trigger.dataset.stepContext = grid.parentElement.parentElement
                    .querySelector(':scope > p').textContent.replace(/\s+/g, ' ').trim()
            }
            if (trigger.dataset.attachmentType === 'log') {
                const parsed = parseJSON(trigger.dataset.attachmentContent)
                if (parsed.parsed) trigger.dataset.attachmentContent = JSON.stringify(parsed.value, null, 2)
            }
        }

        for (const group of groups) {
            const request = [...group.querySelectorAll('.modal-trigger')]
                .find(trigger => trigger.dataset.attachmentName.startsWith('Request ('))
            if (!request) continue
            const parsed = parseJSON(request.dataset.attachmentContent)
            if (!parsed.parsed) continue
            const order = ['Request (', 'Response body (', 'Response image (', 'Response headers', 'cURL command']
            const priority = trigger => {
                const index = order.findIndex(prefix => trigger.dataset.attachmentName.startsWith(prefix))
                return index === -1 ? order.length : index
            }
            request.parentElement.append(...[...request.parentElement.children].sort((a, b) => priority(a) - priority(b)))
            group.before(element('p', 'maf-api-summary', `${parsed.value.method} ${parsed.value.absoluteUrl}`))
        }

        document.addEventListener('click', event => {
            const trigger = event.target.closest('.modal-trigger')
            if (!trigger || trigger.dataset.attachmentType !== 'log') return
            queueMicrotask(() => {
                const toolbar = document.querySelector('#modal-content #copy-btn')?.parentElement
                if (!toolbar) return
                const content = trigger.dataset.attachmentContent
                const isJSON = parseJSON(content).parsed
                toolbar.querySelector('span').textContent = isJSON ? 'JSON DATA' : 'TEXT LOG'
                const download = element('a', 'maf-download', 'Download')
                download.href = `data:${isJSON ? 'application/json' : 'text/plain'};charset=utf-8,${encodeURIComponent(content)}`
                download.download = `${trigger.dataset.attachmentName.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '').toLowerCase()}.${isJSON ? 'json' : 'txt'}`
                toolbar.append(download)
            })
        })
    }

    function fitModal(modal) {
        if (modal.classList.contains('hidden')) return
        const bounds = modal.getBoundingClientRect()
        const left = Math.max(0, Math.min(bounds.left, window.innerWidth - bounds.width))
        const top = Math.max(0, Math.min(bounds.top, window.innerHeight - bounds.height))
        if (left !== bounds.left) {
            modal.style.left = `${left}px`
            modal.style.right = 'auto'
        }
        if (top !== bounds.top) modal.style.top = `${top}px`
    }

    function init() {
        compactLayout()
        improveAttachments()
        const modal = document.getElementById('media-modal')
        if (modal) {
            const fit = () => fitModal(modal)
            new MutationObserver(fit).observe(modal, { attributes: true, attributeFilter: ['class'] })
            window.addEventListener('resize', fit)
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})()
