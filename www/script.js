// --- Tab 1: formatted MQTT data ---
let mqttClient = null;

// ✅ Create a global container for the MQTT status indicator
function createMqttStatusIndicator() {
    // Find the first tab content container
    const firstTabContent = document.querySelector('.tabcontent');
    if (!firstTabContent) return;

    // If already exists, don't create again
    if (document.getElementById('mqtt-status-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'mqtt-status-indicator';
    indicator.style.cssText = `
        text-align: center;
        padding: 10px;
        margin: 10px auto;
        font-weight: bold;
        background-color: #f0f8ff;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        width: fit-content;
        min-width: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    indicator.innerHTML = `
        <span>MQTT connection status:</span>
        <span id="mqtt-status-dot" style="
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: red;
            margin: 0 10px;
        "></span>
        <span id="mqtt-status-text">Disconnected</span>
    `;
    // Insert just before the first tab
    firstTabContent.parentNode.insertBefore(indicator, firstTabContent);
}

function updateMqttStatus(state) {
    const dot = document.getElementById('mqtt-status-dot');
    const text = document.getElementById('mqtt-status-text');
    if (!dot || !text) return;

    switch (state) {
        case 'connected':
            dot.style.backgroundColor = '#4CAF50'; // green
            text.textContent = 'Connected';
            break;
        case 'reconnecting':
            dot.style.backgroundColor = '#FF9800'; // amber
            text.textContent = 'Reconnecting...';
            break;
        case 'disconnected':
            dot.style.backgroundColor = '#f44336'; // red
            text.textContent = 'Disconnected';
            break;
        default:
            dot.style.backgroundColor = '#9E9E9E'; // gray
            text.textContent = 'Unknown';
    }
}

function formatDataForDisplay(data) {
    // Detect if it's the "Totals" JSON
    const isTotals = data.hasOwnProperty("total_system_load_percentage");

    if (isTotals) {
        // === TOTALS: requested grouping and ordering ===
        const groups = {
            "⚡ Energy": {},
            "🔌 Grid": {},
            "☀️ PV": {},
            "🔋 Batteries": {},
            "ℹ️ Status": {}
        };

        // ⚡ Energy
        if (data.hasOwnProperty("total_system_ac_output_apparent_power"))
            groups["⚡ Energy"]["Total apparent power (VA)"] = data.total_system_ac_output_apparent_power;
        if (data.hasOwnProperty("total_system_ac_output_active_power"))
            groups["⚡ Energy"]["Total active power (W)"] = data.total_system_ac_output_active_power;
        if (data.hasOwnProperty("total_system_ac_output_reactive_power"))
            groups["⚡ Energy"]["Total reactive power (VAR)"] = data.total_system_ac_output_reactive_power;
        if (data.hasOwnProperty("total_system_load_percentage"))
            groups["⚡ Energy"]["Total System Load Percentage (%)"] = data.total_system_load_percentage;

        // 🔌 Grid
        if (data.hasOwnProperty("total_system_grid_input_voltage"))
            groups["🔌 Grid"]["Total System Grid Input Voltage (V)"] = data.total_system_grid_input_voltage;
        if (data.hasOwnProperty("total_system_grid_input_frequency"))
            groups["🔌 Grid"]["Total System Grid Input Frequency (Hz)"] = data.total_system_grid_input_frequency;
        // 🔸 NEW: Total estimated AC input power → with clear name
        if (data.hasOwnProperty("total_system_estimate_ac_input_power"))
            groups["🔌 Grid"]["Estimated charging power (W)"] = data.total_system_estimate_ac_input_power;

        // ☀️ PV
        if (data.hasOwnProperty("total_system_pv_input_current"))
            groups["☀️ PV"]["Total PV current (A)"] = data.total_system_pv_input_current;
        if (data.hasOwnProperty("total_system_pv_input_power"))
            groups["☀️ PV"]["Total PV power (W)"] = data.total_system_pv_input_power;

        // 🔋 Batteries
        if (data.hasOwnProperty("total_system_battery_voltage"))
            groups["🔋 Batteries"]["Average battery voltage (V)"] = data.total_system_battery_voltage;
        if (data.hasOwnProperty("total_system_battery_soc"))
            groups["🔋 Batteries"]["Average state of charge (%)"] = data.total_system_battery_soc;
        if (data.hasOwnProperty("total_system_battery_charging_current"))
            groups["🔋 Batteries"]["Total battery charge (A)"] = data.total_system_battery_charging_current;
        if (data.hasOwnProperty("total_system_battery_discharge_current"))
            groups["🔋 Batteries"]["Total battery discharge (A)"] = data.total_system_battery_discharge_current;
        // 🔸 NEW: Net battery → with clear names
        if (data.hasOwnProperty("total_system_battery_real_charge"))
            groups["🔋 Batteries"]["Real charge current (A)"] = data.total_system_battery_real_charge;
        if (data.hasOwnProperty("total_system_battery_power"))
            groups["🔋 Batteries"]["Real charge power (W)"] = data.total_system_battery_power;

        // ℹ️ Status
        if (data.hasOwnProperty("system_general_status"))
            groups["ℹ️ Status"]["System General Status"] = data.system_general_status;

        return groups;
    } else {
        // === INVERTERS: requested grouping and ordering ===
        const groups = {
            "ℹ️ Inverter": {},
            "💻 AC Output": {},
            "🔌 Grid (AC Input)": {},
            "☀️ PV (Solar)": {},
            "🔋 Battery": {},
            "ℹ️ Status": {},
            "⚠️ Alarms": {},
            "⚙️ Configuration": {},
            " Others": {}
        };

        const fieldMap = {
            // ℹ️ Inverter
            "inverter_id": ["ℹ️ Inverter", "Inverter ID"],
            "serial_number": ["ℹ️ Inverter", "Serial number"],

            // 💻 AC Output
            "ac_output_voltage": ["💻 AC Output", "Output voltage (V)"],
            "ac_output_apparent_power": ["💻 AC Output", "Apparent power (VA)"],
            "ac_output_active_power": ["💻 AC Output", "Active power (W)"],
            "ac_output_reactive_power": ["💻 AC Output", "Reactive power (VAR)"],
            "ac_output_frequency": ["💻 AC Output", "Output frequency (Hz)"],
            "load_percentage": ["💻 AC Output", "Load (%)"],

            // 🔌 Grid (AC Input)
            "grid_input_voltage": ["🔌 Grid (AC Input)", "Input voltage (V)"],
            "grid_input_frequency": ["🔌 Grid (AC Input)", "Input frequency (Hz)"],
            // 🔸 CORRECTED: in "Grid (AC Input)" with clear name
            "ac_input_power_estimate": ["🔌 Grid (AC Input)", "Estimated charging power (W)"],

            // ☀️ PV (Solar)
            "pv1_input_voltaje": ["☀️ PV (Solar)", "PV1 voltage (V)"],
            "pv1_input_current": ["☀️ PV (Solar)", "PV1 current (A)"],
            "pv1_input_power": ["☀️ PV (Solar)", "PV1 power (W)"],
            "pv2_input_voltaje": ["☀️ PV (Solar)", "PV2 voltage (V)"],
            "pv2_input_current": ["☀️ PV (Solar)", "PV2 current (A)"],
            "pv2_input_power": ["☀️ PV (Solar)", "PV2 power (W)"],
            "pv_total_input_current": ["☀️ PV (Solar)", "Total PV current (A)"],
            // 🔸 REMOVED: redundant fields
            // "total_inv_pv_input_current": ["☀️ PV (Solar)", "Total PV current (A)"],
            // "total_inv_pv_input_power": ["☀️ PV (Solar)", "Total PV power (W)"],

            // 🔋 Battery
            "battery_voltage": ["🔋 Battery", "Voltage (V)"],
            "battery_charging_current": ["🔋 Battery", "Charging current (A)"],
            "battery_discharge_current": ["🔋 Battery", "Discharge current (A)"],
            "battery_soc": ["🔋 Battery", "State of charge (%)"],
            // 🔸 REMOVED: do not include "battery_total_all_inputs_charging_current"
            // 🔸 CORRECTED: in "Battery" with clear names
            "battery_real_charge_current": ["🔋 Battery", "Real charge current (A)"],
            "battery_real_power": ["🔋 Battery", "Real charge power (W)"],

            // ℹ️ Status
            "status_ac_charging": ["ℹ️ Status", "AC charging active"],
            "status_configuration": ["ℹ️ Status", "Configuration active"],
            "status_load_on": ["ℹ️ Status", "Load connected"],
            "status_solar_charging": ["ℹ️ Status", "Solar charging active"],
            "work_mode": ["ℹ️ Status", "Work mode"],

            // ⚠️ Alarms
            "01_fan_locked": ["⚠️ Alarms", "Fan locked"],
            "02_over_temperature": ["⚠️ Alarms", "Over temperature"],
            "03_battery_voltage_high": ["⚠️ Alarms", "Battery overvoltage"],
            "04_battery_voltage_low": ["⚠️ Alarms", "Battery undervoltage"],
            "05_output_short_circuited": ["⚠️ Alarms", "Output short circuit"],
            "06_output_voltage_high": ["⚠️ Alarms", "Output overvoltage"],
            "07_overload_timeout": ["⚠️ Alarms", "Overload"],
            "08_bus_voltage_high": ["⚠️ Alarms", "High DC bus"],
            "09_bus_soft_start_failed": ["⚠️ Alarms", "Soft start failed"],
            "10_pv_over_current": ["⚠️ Alarms", "PV overcurrent"],
            "11_pv_over_voltage": ["⚠️ Alarms", "PV overvoltage"],
            "12_dcdc_over_current": ["⚠️ Alarms", "DC-DC overcurrent"],
            "13_battery_discharge_over_current": ["⚠️ Alarms", "Excessive battery discharge"],
            "51_over_current": ["⚠️ Alarms", "Output overcurrent"],
            "52_bus_voltage_low": ["⚠️ Alarms", "Low DC bus"],
            "53_inverter_soft_start_failed": ["⚠️ Alarms", "Inverter soft start failed"],
            "55_over_dc_voltage_in_ac_output": ["⚠️ Alarms", "DC in AC output"],
            "57_current_sensor_failed": ["⚠️ Alarms", "Current sensor failed"],
            "58_output_voltage_low": ["⚠️ Alarms", "Output undervoltage"],
            "60_power_feedback_protection": ["⚠️ Alarms", "Power feedback protection"],
            "71_firmware_version_inconsistent": ["⚠️ Alarms", "Inconsistent firmware"],
            "72_current_sharing_fault": ["⚠️ Alarms", "Current sharing fault"],
            "80_can_fault": ["⚠️ Alarms", "CAN fault"],
            "81_host_loss": ["⚠️ Alarms", "Host loss"],
            "82_synchronization_loss": ["⚠️ Alarms", "Synchronization loss"],
            "83_battery_voltage_diff_parallel": ["⚠️ Alarms", "Battery voltage difference in parallel"],
            "84_ac_input_diff_parallel": ["⚠️ Alarms", "AC input difference in parallel"],
            "85_ac_output_unbalance": ["⚠️ Alarms", "AC output unbalance"],
            "86_ac_output_mode_diff": ["⚠️ Alarms", "Different AC output mode"],
            "alarm_battery_health": ["⚠️ Alarms", "Poor battery health"],
            "alarm_line_loss": ["⚠️ Alarms", "Grid loss"],
            "alarm_scc_loss": ["⚠️ Alarms", "SCC communication loss"],

            // ⚙️ Configuration
            "charger_source_priority": ["⚙️ Configuration", "Charger source priority"],
            "config_max_ac_charger_current": ["⚙️ Configuration", "Max AC charge (A)"],
            "config_max_charge_range": ["⚙️ Configuration", "Max charge range"],
            "config_max_charger_current": ["⚙️ Configuration", "Max battery charge (A)"],
            "output_mode": ["⚙️ Configuration", "Output mode"],
            "parallel_configuration": ["⚙️ Configuration", "Parallel config"]
        };

        for (const [key, value] of Object.entries(data)) {
            if (key in fieldMap) {
                const [group, label] = fieldMap[key];
                groups[group][label] = value;
            }
        }

        const processedKeys = new Set(Object.keys(fieldMap));
        for (const [key, value] of Object.entries(data)) {
            if (processedKeys.has(key) || typeof value === 'object' || value === null) continue;
            let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (key.includes('voltage') || key.includes('voltaje')) label += ' (V)';
            else if (key.includes('current')) label += ' (A)';
            else if (key.includes('power') && !key.includes('apparent')) label += ' (W)';
            else if (key.includes('apparent_power')) label += ' (VA)';
            else if (key.includes('frequency')) label += ' (Hz)';
            else if (key.includes('percentage') || key.includes('percentaje') || key.includes('soc')) label += ' (%)';
            groups[" Others"][label] = value;
        }

        if (Object.keys(groups[" Others"]).length === 0) {
            delete groups[" Others"];
        }

        return groups;
    }
}

function renderGroupedData(containerId, data) {
    const groups = formatDataForDisplay(data);
    let html = '';

    for (const [groupName, fields] of Object.entries(groups)) {
        if (Object.keys(fields).length === 0) continue;
        html += `<h4>${groupName}</h4><div class="group-content">`;
        for (const [label, value] of Object.entries(fields)) {
            let displayValue = value;
            if (typeof value === 'number' && !Number.isInteger(value)) {
                displayValue = parseFloat(value.toFixed(2));
            }
            html += `<div class="data-row"><span class="label">${label}:</span> <span class="value">${displayValue}</span></div>`;
        }
        html += `</div>`;
    }

    document.getElementById(containerId).innerHTML = html || '<em>No data</em>';
}

function loadMqttConfigAndConnect() {
    fetch('/config/app_config.json')
        .then(res => res.json())
        .then(config => {
            const broker = config.mqtt_broker_ip;
            const port = config.mqtt_broker_ws_port || 9001;
            const user = config.mqtt_user || '';
            const password = config.mqtt_password || '';

            if (mqttClient) {
                mqttClient.end();
            }

            mqttClient = mqtt.connect(`ws://${broker}:${port}`, {
                username: user,
                password: password,
                clientId: 'web-client-' + Math.random().toString(16).substr(2, 8),
                reconnectPeriod: 3000,
                connectTimeout: 5000
            });

            mqttClient.on("connect", () => {
                console.log("✅ Connected to MQTT via WebSocket");
                updateMqttStatus('connected');
                mqttClient.subscribe("homeassistant/axpert/inv01");
                mqttClient.subscribe("homeassistant/axpert/inv02");
                mqttClient.subscribe("homeassistant/axpert/totales");
            });

            mqttClient.on("reconnect", () => {
                console.log("🟡 Reconnecting to MQTT...");
                updateMqttStatus('reconnecting');
            });

            mqttClient.on("close", () => {
                console.log("🔴 MQTT connection closed");
                updateMqttStatus('disconnected');
            });

            mqttClient.on("error", (err) => {
                console.error("❌ MQTT error:", err);
                updateMqttStatus('disconnected');
            });

            mqttClient.on("message", (topic, message) => {
                const data = JSON.parse(message.toString());
                if (topic === "homeassistant/axpert/inv01") {
                    renderGroupedData("inv1-data", data);
                } else if (topic === "homeassistant/axpert/inv02") {
                    renderGroupedData("inv2-data", data);
                } else if (topic === "homeassistant/axpert/totales") {
                    renderGroupedData("totals-data", data);
                }
            });
        })
        .catch(err => {
            console.error("❌ Could not load app_config.json:", err);
            document.getElementById("inv1-data").innerHTML = "Error loading configuration";
            updateMqttStatus('disconnected');
        });
}

// === Tab 2: Inverter Configuration ===

const configFieldNames = {
    "01": "01 - Energy source priority",
    "03": "03 - AC input voltage range",
    "06": "06 - Restart after overload",
    "07": "07 - Restart after overtemperature",
    "09": "09 - Output frequency",
    "11": "11 - Max grid charging current",
    "16": "16 - Battery charging priority",
    "18": "18 - Buzzer alarm",
    "19": "19 - Auto return to main screen",
    "20": "20 - Screen backlight",
    "22": "22 - Grid loss alarm",
    "23": "23 - Overload bypass",
    "25": "25 - Fault logging",
    "30": "30 - Enable equalization",
    "41": "41 - Max discharge current"
};

// Mapping: code → { type, options }
const fieldTypes = {
    "01": { type: "select", options: { "USB": "00", "SUB": "01", "SBU": "02" } },
    "03": { type: "select", options: { "APL": "00", "UPS": "01" } },
    "06": { type: "select", options: { "Enable": "PEU", "Disable": "PDU" } },
    "07": { type: "select", options: { "Enable": "PEV", "Disable": "PDV" } },
    "09": { type: "select", options: { "50": "50", "60": "60" } },
    "11": { type: "number", decimals: 0 },
    "16": { type: "select", options: { "SOL": "00", "SNU": "01", "OSO": "02" } },
    "18": { type: "select", options: { "Enable": "PEA", "Disable": "PDA" } },
    "19": { type: "select", options: { "Enable": "PEK", "Disable": "PDK" } },
    "20": { type: "select", options: { "Enable": "PEX", "Disable": "PDX" } },
    "22": { type: "select", options: { "Enable": "PEY", "Disable": "PDY" } },
    "23": { type: "select", options: { "Enable": "PEB", "Disable": "PDB" } },
    "25": { type: "select", options: { "Enable": "PEZ", "Disable": "PDZ" } },
    "30": { type: "select", options: { "Enable": "1", "Disable": "0" } },
    "41": { type: "number", decimals: 0 }
};

// List of "direct" commands (field value is the full command)
const directCommands = ["06", "07", "18", "19", "20", "22", "23", "25"];

// List of silent commands (no ACK/NAK)
const silentCommands = ["PEU", "PDU", "PEV", "PDV", "PEA", "PDA", "PEK", "PDK", "PEX", "PDX", "PEY", "PDY", "PEB", "PDB", "PEZ", "PDZ"];

// ✅ Show all fields from the start (with "Send" button)
function initializeInverterConfig(containerId) {
    // Separate common and specific fields
    const commonFields = ["01", "09"];
    const specificFields = Object.keys(configFieldNames).filter(k => !commonFields.includes(k)).sort((a, b) => parseInt(a) - parseInt(b));

    let html = '';

    // Group 1: Specific configuration
    for (const key of specificFields) {
        const label = configFieldNames[key];
        const inputId = `${containerId}-${key}`;
        const buttonId = `${containerId}-btn-${key}`;
        const fieldType = fieldTypes[key];

        if (fieldType && fieldType.type === "select") {
            html += `<div class="config-row">
        <label>${label}</label>
        <select id="${inputId}">`;
            for (const [text, value] of Object.entries(fieldType.options)) {
                html += `<option value="${value}">${text}</option>`;
            }
            html += `</select><button id="${buttonId}" class="send-btn">Send</button></div>`;
        } else {
            html += `<div class="config-row">
        <label>${label}</label>
        <input type="text" id="${inputId}" value="" />
        <button id="${buttonId}" class="send-btn">Send</button>
      </div>`;
        }
    }

    // Only for inverter 1: Group 2 - Common configurations
    if (containerId === "inv01-config-fields") {
        html += `<h3>Common configurations</h3>`;
        for (const key of commonFields) {
            const label = configFieldNames[key];
            const inputId = `${containerId}-${key}`;
            const buttonId = `${containerId}-btn-${key}`;
            const fieldType = fieldTypes[key];

            if (fieldType && fieldType.type === "select") {
                html += `<div class="config-row">
          <label>${label}</label>
          <select id="${inputId}">`;
                for (const [text, value] of Object.entries(fieldType.options)) {
                    html += `<option value="${value}">${text}</option>`;
                }
                html += `</select><button id="${buttonId}" class="send-btn">Send</button></div>`;
            } else {
                html += `<div class="config-row">
          <label>${label}</label>
          <input type="text" id="${inputId}" value="" />
          <button id="${buttonId}" class="send-btn">Send</button>
        </div>`;
            }
        }
    }

    document.getElementById(containerId).innerHTML = html;

    // ✅ Attach event to each "Send" button
    setTimeout(() => {
        const allKeys = containerId === "inv01-config-fields"
            ? [...specificFields, ...commonFields]
            : specificFields;

        for (const key of allKeys) {
            const buttonId = `${containerId}-btn-${key}`;
            const button = document.getElementById(buttonId);
            if (button) {
                button.onclick = function () {
                    // ✅ Use correct containerId and key
                    const inputId = `${containerId}-${key}`;
                    const input = document.getElementById(inputId);
                    let valueToSend = input ? (input.value || (input.options ? input.options[input.selectedIndex].value : "")) : "";
                    valueToSend = valueToSend.trim();

                    let message = "";
                    const valueStr = valueToSend.toString();

                    // ✅ New logic: direct commands vs formatted commands
                    if (directCommands.includes(key)) {
                        // The field value is the full command
                        message = valueStr;
                    } else if (key === "01") {
                        // ✅ Only inverter 1 can send POP (affects entire system)
                        if (containerId === "inv01-config-fields") {
                            message = "POP" + valueStr.padStart(2, '0');
                        } else {
                            // ❌ Inverter 2: do not send command
                            alert("The POP command can only be sent from Inverter 1 (affects the entire system).");
                            return;
                        }
                    } else if (key === "03") {
                        message = "PGR" + valueStr.padStart(2, '0');
                    } else if (key === "09") {
                        message = "F" + valueStr.padStart(2, '0');
                    } else if (key === "11") {
                        message = "MUCHGC0" + valueStr.padStart(2, '0');
                    } else if (key === "16") {
                        let nn = "00";
                        if (valueStr === "00") nn = "03"; // SOL
                        else if (valueStr === "01") nn = "01"; // SNU
                        else if (valueStr === "02") nn = "02"; // OSO

                        let m = "1"; // affects inverter 2
                        if (containerId === "inv01-config-fields") {
                            m = "2"; // affects inverter 1
                        }
                        message = "PPCP" + m + nn;
                    } else if (key === "30") {
                        message = "PBEQE" + valueStr;
                    } else if (key === "41") {
                        message = "PBATMAXDISC" + valueStr.padStart(3, '0');
                    } else {
                        message = valueToSend;
                    }

                    // ✅ Get IP and port of corresponding inverter
                    let ip, port;
                    if (containerId === "inv01-config-fields") {
                        ip = document.getElementById('inverter1_tcp_ip')?.value || '10.0.0.235';
                        port = parseInt(document.getElementById('inverter1_tcp_port')?.value) || 26;
                    } else if (containerId === "inv02-config-fields") {
                        ip = document.getElementById('inverter2_tcp_ip')?.value || '10.0.0.236';
                        port = parseInt(document.getElementById('inverter2_tcp_port')?.value) || 27;
                    } else {
                        // fallback
                        ip = '10.0.0.235';
                        port = 26;
                    }

                    tcp_serial_communication(message, ip, port, button);
                };
            }
        }
    }, 100);
}

// ✅ Load from JSON (updates selects and inputs)
function loadInverterConfig(invId) {
    const url = invId === 'inv01' ? '/config/inv01_config.json' : '/config/inv02_config.json';
    const containerId = invId + '-config-fields';
    const statusId = 'status-' + invId;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('File not found');
            return res.json();
        })
        .then(data => {
            for (const key in configFieldNames) {
                // Only load fields present in container
                if (invId === 'inv02' && ["01", "09"].includes(key)) continue;

                const inputId = `${containerId}-${key}`;
                const el = document.getElementById(inputId);
                if (el && data.hasOwnProperty(key)) {
                    if (el.tagName === "SELECT") {
                        // Find option with that value
                        for (const option of el.options) {
                            if (option.value === data[key]) {
                                option.selected = true;
                                break;
                            }
                        }
                    } else {
                        el.value = data[key];
                    }
                }
            }
            document.getElementById(statusId).textContent = "✅ Configuration loaded.";
            document.getElementById(statusId).style.color = "green";
        })
        .catch(err => {
            console.error("Error loading config:", err);
            document.getElementById(statusId).textContent = "❌ Error loading.";
            document.getElementById(statusId).style.color = "red";
        });
}

// ✅ Save: gets actual value (select value or input value)
function saveInverterConfig(invId) {
    const url = invId === 'inv01' ? '/config/inv01_config.json' : '/config/inv02_config.json';
    const statusId = 'status-' + invId;
    const config = {};

    for (const key in configFieldNames) {
        if (configFieldNames.hasOwnProperty(key)) {
            // In inverter 2, do not save common fields
            if (invId === 'inv02' && ["01", "09"].includes(key)) continue;

            const inputId = `${invId}-config-fields-${key}`;
            const el = document.getElementById(inputId);
            if (el) {
                config[key] = el.value;
            }
        }
    }

    fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config, null, 2)
    })
        .then(res => {
            if (res.ok) {
                document.getElementById(statusId).textContent = "✅ Saved successfully.";
                document.getElementById(statusId).style.color = "green";
            } else {
                throw new Error('HTTP ' + res.status);
            }
        })
        .catch(err => {
            console.error("Error saving config:", err);
            document.getElementById(statusId).textContent = "❌ Error saving.";
            document.getElementById(statusId).style.color = "red";
        });
}

// === Communication with inverter via TCP/Serial (through server) ===
async function tcp_serial_communication(command, ip, port, button) {
    try {
        const isSilent = silentCommands.includes(command);
        const originalText = button.textContent;

        const response = await fetch('/api/send-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command, ip, port })
        });

        if (isSilent) {
            // For silent commands, assume success after timeout
            setTimeout(() => {
                button.textContent = "Command applied";
                button.style.backgroundColor = "#4CAF50";
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = "";
                }, 1500);
            }, 1000);
        } else {
            const data = await response.json();
            const message = data.status;
            button.textContent = message;
            button.style.backgroundColor = message === "Command accepted" ? "#4CAF50" : "#f44336";
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = "";
            }, 2000);
        }

    } catch (err) {
        console.error("Error sending command:", err);
        button.textContent = "Network error";
        setTimeout(() => button.textContent = "Send", 1500);
    }
}

// Initialize Tab 2 on load
document.addEventListener('DOMContentLoaded', function () {
    createMqttStatusIndicator(); // ✅ Indicator visible without index.html
    loadMqttConfigAndConnect();
    setInterval(loadMqttConfigAndConnect, 10000);

    initializeInverterConfig('inv01-config-fields');
    initializeInverterConfig('inv02-config-fields');
});

// --- Tab 3: Configuration (USING inverter1_tcp_ip) ---
function loadConfig() {
    fetch('/config/app_config.json')
        .then(res => res.json())
        .then(config => {
            document.getElementById('delay_between_inverters_ms').value = config.delay_between_inverters_ms || 1000;
            document.getElementById('inverter1_tcp_ip').value = config.inverter1_tcp_ip || '10.0.0.235';
            document.getElementById('inverter1_tcp_port').value = config.inverter1_tcp_port || 26;
            document.getElementById('inverter2_tcp_ip').value = config.inverter2_tcp_ip || '10.0.0.236';
            document.getElementById('inverter2_tcp_port').value = config.inverter2_tcp_port || 27;
            document.getElementById('mqtt_broker_ip').value = config.mqtt_broker_ip || '10.0.0.250';
            document.getElementById('mqtt_broker_port').value = config.mqtt_broker_port || 1883;
            document.getElementById('mqtt_broker_ws_port').value = config.mqtt_broker_ws_port || 9001;
            document.getElementById('mqtt_user').value = config.mqtt_user || '';
            document.getElementById('mqtt_password').value = config.mqtt_password || '';
            setStatus("✅ Configuration loaded from file.", "success");
        })
        .catch(err => {
            console.error("Error loading config:", err);
            setStatus("❌ Error loading configuration.", "error");
        });
}

function saveConfig() {
    const config = {
        delay_between_inverters_ms: parseInt(document.getElementById('delay_between_inverters_ms').value) || 1000,
        inverter1_tcp_ip: document.getElementById('inverter1_tcp_ip').value.trim(),
        inverter1_tcp_port: parseInt(document.getElementById('inverter1_tcp_port').value) || 26,
        inverter2_tcp_ip: document.getElementById('inverter2_tcp_ip').value.trim(),
        inverter2_tcp_port: parseInt(document.getElementById('inverter2_tcp_port').value) || 27,
        mqtt_broker_ip: document.getElementById('mqtt_broker_ip').value.trim(),
        mqtt_broker_port: parseInt(document.getElementById('mqtt_broker_port').value) || 1883,
        mqtt_broker_ws_port: parseInt(document.getElementById('mqtt_broker_ws_port').value) || 9001,
        mqtt_user: document.getElementById('mqtt_user').value.trim(),
        mqtt_password: document.getElementById('mqtt_password').value
    };

    fetch('/config/app_config.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config, null, 2)
    })
        .then(res => {
            if (res.ok) {
                setStatus("✅ Configuration saved successfully.", "success");
            } else {
                throw new Error('Error ' + res.status);
            }
        })
        .catch(err => {
            console.error("Error saving config:", err);
            setStatus("❌ Error saving configuration.", "error");
        });
}

function setStatus(message, type) {
    const statusEl = document.getElementById('config-status');
    statusEl.textContent = message;
    statusEl.style.color = type === 'error' ? 'red' : 'green';
}

function openTab(evt, tabName) {
    const tabs = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";

    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    evt.currentTarget.classList.add("active");
}
