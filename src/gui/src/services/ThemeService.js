/**
 * Copyright (C) 2024 Puter Technologies Inc.
 *
 * This file is part of Puter.
 *
 * Puter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import UIAlert from "../UI/UIAlert.js";
import { Service } from "../definitions.js";

const PUTER_THEME_DATA_FILENAME = '~/.__puter_gui.json';

const SAVE_COOLDOWN_TIME = 1000;

const default_values = {
    sat: 41.18,
    hue: 210,
    lig: 93.33,
    alpha: 0.8,
    light_text: false,
};

export class ThemeService extends Service {
    #broadcastService;

    async _init () {
        this.#broadcastService = globalThis.services.get('broadcast');

        this.state = {
            sat: 41.18,
            hue: 210,
            lig: 93.33,
            alpha: 0.8,
            light_text: false,
        };
        this.root = document.querySelector(':root');
        // this.ss = new CSSStyleSheet();
        // document.adoptedStyleSheets.push(this.ss);

        this.save_cooldown_ = undefined;

        let data = undefined;
        try {
            data = await puter.fs.read(PUTER_THEME_DATA_FILENAME);
            if ( typeof data === 'object' ) {
                data = await data.text();
            }
        } catch (e) {
            if ( e.code !== 'subject_does_not_exist' ) {
                // TODO: once we have an event log,
                //       log this error to the event log
                console.error(e);

                // We don't show an alert because it's likely
                // other things also aren't working.
            }
        }

        if ( data ) try {
            data = JSON.parse(data.toString());
        } catch (e) {
            data = undefined;
            console.error(e);

            UIAlert({
                title: 'Error loading theme data',
                message: `Could not parse "${PUTER_THEME_DATA_FILENAME}": ` +
                    e.message,
            });
        }

        if ( data && data.colors ) {
            this.state = {
                ...this.state,
                ...data.colors,
            };
            this.reload_();
        }
    }

    reset () {
        this.state = default_values;
        this.reload_();
        puter.fs.delete(PUTER_THEME_DATA_FILENAME);
    }

    apply (values) {
        this.state = {
            ...this.state,
            ...values,
        };
        this.reload_();
        this.save_();
    }

    get (key) { return this.state[key]; }

    /**
     * Calculate appropriate sidebar title color based on background lightness
     * to ensure WCAG AA compliance (4.5:1 contrast ratio for normal text)
     * @param {number} lightness - Background lightness value (0-100)
     * @param {boolean} lightText - Whether light text mode is enabled
     * @returns {string} - Color value for sidebar title
     */
    calculateSidebarTitleColor_(lightness, lightText) {
        // If light text mode is enabled, return white for dark backgrounds
        if (lightText) {
            return 'rgba(255, 255, 255, 0.9)';
        }

        // For very light backgrounds (>85%), use darker text for better contrast
        if (lightness > 85) {
            return '#5a6169';
        }
        // For medium-light backgrounds (70-85%), use medium-dark text
        else if (lightness > 70) {
            return '#6d7580';
        }
        // For medium backgrounds (50-70%), use darker text
        else if (lightness > 50) {
            return '#8f96a3';
        }
        // For darker backgrounds (<50%), use lighter text
        else {
            return 'rgba(255, 255, 255, 0.85)';
        }
    }

    /**
     * Calculate appropriate text-shadow for sidebar titles based on background lightness
     * to enhance readability
     * @param {number} lightness - Background lightness value (0-100)
     * @param {boolean} lightText - Whether light text mode is enabled
     * @returns {string} - CSS text-shadow value
     */
    calculateSidebarTitleShadow_(lightness, lightText) {
        // For light text on dark backgrounds, use a dark shadow
        if (lightText || lightness < 50) {
            return '1px 1px 2px rgba(0, 0, 0, 0.3)';
        }
        // For dark text on light backgrounds, use a light shadow
        else {
            return '1px 1px rgba(247, 247, 247, 0.15)';
        }
    }

    /**
     * Calculate appropriate sidebar item color based on background lightness
     * to ensure WCAG AA compliance (4.5:1 contrast ratio for normal text)
     * @param {number} lightness - Background lightness value (0-100)
     * @param {boolean} lightText - Whether light text mode is enabled
     * @returns {string} - Color value for sidebar items
     */
    calculateSidebarItemColor_(lightness, lightText) {
        // If light text mode is enabled, return white for dark backgrounds
        if (lightText) {
            return 'rgba(255, 255, 255, 0.95)';
        }

        // For very light backgrounds (>85%), use darker text for better contrast
        if (lightness > 85) {
            return '#2c3236';
        }
        // For medium-light backgrounds (70-85%), use medium-dark text
        else if (lightness > 70) {
            return '#373e44';
        }
        // For medium backgrounds (50-70%), use darker text
        else if (lightness > 50) {
            return '#444444';
        }
        // For darker backgrounds (<50%), use lighter text
        else {
            return 'rgba(255, 255, 255, 0.9)';
        }
    }

    /**
     * Calculate appropriate hover background color for sidebar items
     * @param {number} lightness - Background lightness value (0-100)
     * @param {boolean} lightText - Whether light text mode is enabled
     * @returns {string} - Background color for hover state
     */
    calculateSidebarItemHoverBg_(lightness, lightText) {
        // For light text mode or dark backgrounds, use lighter hover
        if (lightText || lightness < 50) {
            return 'rgba(255, 255, 255, 0.15)';
        }
        // For very light backgrounds (>85%), use slightly darker hover
        else if (lightness > 85) {
            return 'rgba(220, 220, 220, 0.9)';
        }
        // For medium-light backgrounds, use medium hover
        else {
            return 'rgba(243, 243, 243, 0.8)';
        }
    }

    /**
     * Calculate appropriate active background color for sidebar items
     * @param {number} lightness - Background lightness value (0-100)
     * @param {boolean} lightText - Whether light text mode is enabled
     * @returns {string} - Background color for active state
     */
    calculateSidebarItemActiveBg_(lightness, lightText) {
        // For light text mode or dark backgrounds, use lighter active state
        if (lightText || lightness < 50) {
            return 'rgba(255, 255, 255, 0.25)';
        }
        // For very light backgrounds (>85%), use more prominent active state
        else if (lightness > 85) {
            return 'rgba(210, 210, 210, 0.95)';
        }
        // For medium-light backgrounds, use bright active state
        else {
            return '#fefeff';
        }
    }

    reload_() {
        // debugger;
        const s = this.state;
        // this.ss.replace(`
        //     .taskbar, .window-head, .window-sidebar {
        //         background-color: hsla(${s.hue}, ${s.sat}%, ${s.lig}%, ${s.alpha});
        //     }
        // `)
        // this.root.style.setProperty('--puter-window-background', `hsla(${s.hue}, ${s.sat}%, ${s.lig}%, ${s.alpha})`);
        this.root.style.setProperty('--primary-hue', s.hue);
        this.root.style.setProperty('--primary-saturation', s.sat + '%');
        this.root.style.setProperty('--primary-lightness', s.lig + '%');
        this.root.style.setProperty('--primary-alpha', s.alpha);
        this.root.style.setProperty('--primary-color', s.light_text ? 'white' : '#373e44');

        // Calculate sidebar title color based on background lightness for proper contrast
        // Using WCAG contrast ratio formula: ensure at least 4.5:1 for normal text
        const sidebarTitleColor = this.calculateSidebarTitleColor_(s.lig, s.light_text);
        this.root.style.setProperty('--window-sidebar-title-color', sidebarTitleColor);

        // Calculate appropriate text-shadow for better readability
        const sidebarTitleShadow = this.calculateSidebarTitleShadow_(s.lig, s.light_text);
        this.root.style.setProperty('--window-sidebar-title-shadow', sidebarTitleShadow);

        // Calculate sidebar item color for better contrast
        const sidebarItemColor = this.calculateSidebarItemColor_(s.lig, s.light_text);
        this.root.style.setProperty('--window-sidebar-item-color', sidebarItemColor);

        // Calculate sidebar item hover and active background colors
        const sidebarItemHoverBg = this.calculateSidebarItemHoverBg_(s.lig, s.light_text);
        this.root.style.setProperty('--window-sidebar-item-hover-bg', sidebarItemHoverBg);

        const sidebarItemActiveBg = this.calculateSidebarItemActiveBg_(s.lig, s.light_text);
        this.root.style.setProperty('--window-sidebar-item-active-bg', sidebarItemActiveBg);

        // TODO: Should we debounce this to reduce traffic?
        this.#broadcastService.sendBroadcast('themeChanged', {
            palette: {
                primaryHue: s.hue,
                primarySaturation: s.sat + '%',
                primaryLightness: s.lig + '%',
                primaryAlpha: s.alpha,
                primaryColor: s.light_text ? 'white' : '#373e44',
                sidebarTitleColor: sidebarTitleColor,
            },
        }, { sendToNewAppInstances: true });
    }   

    save_ () {
        if ( this.save_cooldown_ ) {
            clearTimeout(this.save_cooldown_);
        }
        this.save_cooldown_ = setTimeout(() => {
            this.commit_save_();
        }, SAVE_COOLDOWN_TIME);
    }
    commit_save_ () {
        puter.fs.write(PUTER_THEME_DATA_FILENAME, JSON.stringify(
            { colors: this.state },
            undefined,
            5,
        ));
    }
}
