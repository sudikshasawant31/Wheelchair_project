
# EFY Arduino UNO Q – Brain-Controlled Smart Wheelchair

## Overview
An assistive mobility system that enables wheelchair control through intentional eye blinks detected using a MindWave EEG headset. The Arduino UNO Q interfaces with motors and sensors for movement control, obstacle detection, and safety monitoring.

## Features
- EEG-based eye-blink control using Python
- Movement commands: Stop, Forward, Left, and Right
- Obstacle detection using HC-SR04
- Tilt detection using MPU6050
- GPS tracking using NEO-6M
- Battery monitoring using INA226
- Emergency-stop mechanism
- LED matrix status display and telemetry dashboard

## Hardware
- Arduino UNO Q
- MindWave EEG Headset
- BTS7960 Motor Drivers
- DC Geared Motors
- HC-SR04 Ultrasonic Sensor
- MPU6050 IMU
- NEO-6M GPS Module
- INA226 Monitoring Module
- LED Matrix and Emergency-Stop Switch

## Technologies
Arduino/C++, Python, SVM-based blink classification, GPIO, I2C, UART, and network communication.

## Working Principle
The EEG headset captures signals, and a Python application detects blink patterns and transmits movement commands to the Arduino UNO Q. The controller manages motor outputs, monitors safety sensors, and reports system status to the dashboard.

## Applications
- Assistive Mobility
- Brain-Computer Interface Research
- Embedded Systems and Robotics

## Safety Notice
This project is a research prototype and is not a certified medical device. Thorough safety testing is required before real-world use.

## Project Team
Add team members, institution, and EFY event details here.
