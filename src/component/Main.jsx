import React, { useState } from 'react';
import './style/main.scss';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { GrRotateLeft, GrRotateRight } from 'react-icons/gr';
import { CgMergeVertical, CgMergeHorizontal } from 'react-icons/cg';
import { IoMdUndo, IoMdRedo, IoIosImage } from 'react-icons/io';
import axios from 'axios';
import storeData from './LinkedList';

const Main = () => {
    const [result, setResult] = useState('');
    const [file, setFile] = useState(null);

    const filterElement = [
        {
            name: 'brightness',
            maxValue: 200
        },
        {
            name: 'grayscale',
            maxValue: 200
        },
        {
            name: 'sepia',
            maxValue: 200
        },
        {
            name: 'saturate',
            maxValue: 200
        },
        {
            name: 'contrast',
            maxValue: 200
        },
        {
            name: 'hueRotate'
        }
    ];

    const [property, setProperty] = useState(
        {
            name: 'brightness',
            maxValue: 200
        }
    );
    const [details, setDetails] = useState('');
    const [crop, setCrop] = useState('');
    const [state, setState] = useState({
        image: '',
        brightness: 100,
        grayscale: 0,
        sepia: 0,
        saturate: 100,
        contrast: 100,
        hueRotate: 0,
        rotate: 0,
        vartical: 1,
        horizental: 1
    });
    const [prediction, setPrediction] = useState('');

    const inputHandle = (e) => {
        setState({
            ...state,
            [e.target.name]: e.target.value
        });
    };

    const leftRotate = () => {
        setState({
            ...state,
            rotate: state.rotate - 90
        });
        const stateData = state;
        stateData.rotate = state.rotate - 90;
        storeData.insert(stateData);
    };

    const rightRotate = () => {
        setState({
            ...state,
            rotate: state.rotate + 90
        });
        const stateData = state;
        stateData.rotate = state.rotate + 90;
        storeData.insert(stateData);
    };

    const varticalFlip = () => {
        setState({
            ...state,
            vartical: state.vartical === 1 ? -1 : 1
        });
        const stateData = state;
        stateData.vartical = state.vartical === 1 ? -1 : 1;
        storeData.insert(stateData);
    };

    const horizentalFlip = () => {
        setState({
            ...state,
            horizental: state.horizental === 1 ? -1 : 1
        });
        const stateData = state;
        stateData.horizental = state.horizental === 1 ? -1 : 1;
        storeData.insert(stateData);
    };

    const redo = () => {
        const data = storeData.redoEdit();
        if (data) {
            setState(data);
        }
    };

    const undo = () => {
        const data = storeData.undoEdit();
        if (data) {
            setState(data);
        }
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    const imageHandle = (e) => {
        if (e.target.files.length !== 0) {
            const selectedFile = e.target.files[0];

            // Check if file exceeds the max size
            if (selectedFile.size > MAX_FILE_SIZE) {
                alert("File size exceeds the 5MB limit.");
                return; // Prevent uploading
            }

            setFile(selectedFile);
            setResult('');
            const reader = new FileReader();
            reader.onload = async () => {
                const newImage = reader.result;
                setState({
                    ...state,
                    image: newImage
                });

                const stateData = {
                    image: newImage,
                    brightness: 100,
                    grayscale: 0,
                    sepia: 0,
                    saturate: 100,
                    contrast: 100,
                    hueRotate: 0,
                    rotate: 0,
                    vartical: 1,
                    horizental: 1
                };
                storeData.insert(stateData);
            };
            reader.readAsDataURL(selectedFile);
        }
    };


    const imageCrop = () => {
        const canvas = document.createElement('canvas');
        const scaleX = details.naturalWidth / details.width;
        const scaleY = details.naturalHeight / details.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            details,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        const base64Url = canvas.toDataURL('image/jpg');

        setState({
            ...state,
            image: base64Url
        });
    };

    const saveImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = details.naturalWidth;
        canvas.height = details.naturalHeight;
        const ctx = canvas.getContext('2d');

        // Terapkan filter
        ctx.filter = `brightness(${state.brightness}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) grayscale(${state.grayscale}%) hue-rotate(${state.hueRotate}deg)`;

        // Transformasi rotasi dan flip
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(state.rotate * Math.PI / 180);
        ctx.scale(state.vartical, state.horizental);

        // Gambar gambar asli
        ctx.drawImage(details, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        // Kembali ke transformasi normal untuk watermark
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Tambahkan watermark diagonal berulang
        ctx.font = '30px Arial';
        ctx.fillStyle = 'rgba(56, 55, 55, 0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const watermarkText = `${result.konversi.predicted_label}`;
        const spacing = 200;

        ctx.rotate(-Math.PI / 4); // Rotasi diagonal kiri atas ke kanan bawah

        for (let x = -canvas.height; x < canvas.width * 2; x += spacing) {
            for (let y = 0; y < canvas.height * 2; y += spacing) {
                ctx.fillText(watermarkText, x, y);
            }
        }

        // Simpan sebagai file
        const link = document.createElement('a');
        link.download = 'image_with_watermark.jpg';
        link.href = canvas.toDataURL();
        link.click();
    };


     const detectObject = async () => {
        if (!file) {
            alert("Pilih gambar dulu!");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('https://api.bayy.site/predict', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const label = res.data;
            setResult(label);
            // setPrediction(res.data);

            // Membuat canvas baru dengan watermark pattern setelah prediksi
            const img = new Image();
            img.src = state.image;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');

                // Terapkan filter dan transformasi jika perlu (disesuaikan)
                ctx.filter = `brightness(${state.brightness}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) grayscale(${state.grayscale}%) hue-rotate(${state.hueRotate}deg)`;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(state.rotate * Math.PI / 180);
                ctx.scale(state.vartical, state.horizental);
                ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

                // Tambahkan watermark diagonal pattern
                ctx.font = '30px Arial';
                ctx.fillStyle = 'rgba(56, 55, 55, 0.6)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const spacing = 200;
                const watermarkText = `${label.konversi.predicted_label}`;

                ctx.rotate(-Math.PI / 4); // Diagonal watermark
                for (let x = -canvas.height; x < canvas.width * 2; x += spacing) {
                    for (let y = 0; y < canvas.height * 2; y += spacing) {
                        ctx.fillText(watermarkText, x, y);
                    }
                }

                // Simpan hasilnya ke state.image
                const newBase64 = canvas.toDataURL();
                setState(prev => ({
                    ...prev,
                    image: newBase64
                }));

                // Simpan ke history LinkedList
                const stateData = {
                    ...state,
                    image: newBase64
                };
                storeData.insert(stateData);
            };

        } catch (err) {
            console.error(err);
            alert("Gagal memproses gambar.");
        }
    };


    return (
        <div className='image_editor'>
            <div className="card">
                <div className="card_header">
                    <h2>Meat Prediction</h2>
                </div>
                <div className="card_body">
                    <div className="sidebar">
                        <div className="side_body">
                            <div className="filter_section">
                                <span>Filters</span>
                                <div className="filter_key">
                                    {
                                        filterElement.map((v, i) => <button className={property.name === v.name ? 'active' : ''} onClick={() => setProperty(v)} key={i} >{v.name}</button>)
                                    }
                                </div>
                            </div>
                            <div className="filter_slider">
                                <div className="label_bar">
                                    <label htmlFor="range">Rotate</label>
                                    <span>100%</span>
                                </div>
                                <input name={property.name} onChange={inputHandle} value={state[property.name]} max={property.maxValue} type="range" />
                            </div>
                            <div className="rotate">
                                <label htmlFor="">Rotate & Flip</label>
                                <div className="icon">
                                    <div onClick={leftRotate}><GrRotateLeft /></div>
                                    <div onClick={rightRotate}><GrRotateRight /></div>
                                    <div onClick={varticalFlip}><CgMergeVertical /></div>
                                    <div onClick={horizentalFlip}><CgMergeHorizontal /></div>
                                </div>
                            </div>
                        </div>
                        <div className="reset">
                            <button>Reset</button>
                            <button onClick={saveImage} className='save'>Save Image</button>
                            <button onClick={detectObject} className='detect'>Predict</button>
                        </div>
                    </div>
                    <div className="image_section">
                        <div className="image">
                            {
                                state.image ? <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                                    <img onLoad={(e) => setDetails(e.currentTarget)} style={{ filter: `brightness(${state.brightness}%) brightness(${state.brightness}%) sepia(${state.sepia}%) saturate(${state.saturate}%) contrast(${state.contrast}%) grayscale(${state.grayscale}%) hue-rotate(${state.hueRotate}deg)`, transform: `rotate(${state.rotate}deg) scale(${state.vartical},${state.horizental})` }} src={state.image} alt="" />
                                </ReactCrop> :
                                    <label htmlFor="choose">
                                        <IoIosImage />
                                        <span>Choose Image</span>
                                    </label>
                            }
                        </div>
                       <div className="image_result" style={{"textAlign":"left"}}>
                            {result ? (
                                <div className="prediction_card">
                                    <h3>🔍 Prediksi: <span style={{ color: 'crimson' }}>{result.konversi.predicted_label}</span></h3>
                                    <p>📊 Confidence: {(result.konversi.confidence * 100).toFixed(2)}%</p>
                                    <p>🖼️ Ukuran: {result.ekstraksi.original_size[0]} x {result.ekstraksi.original_size[1]} px → {result.ekstraksi.resized_to[0]} x {result.ekstraksi.resized_to[1]} px</p>
                                </div>
                            ) : (
                                <div class="prediction_card">
                                    <h3>🔍 Prediksi: <span style={{ color: 'crimson' }} ></span></h3>
                                    <p>📊 Confidence: %</p>
                                    <p>🖼️ Ukuran:  x  px →  x  px</p>
                                </div>

                            )}
                        </div>

                        <div className="image_select">
                            <button onClick={undo} className='undo'><IoMdUndo /></button>
                            <button onClick={redo} className='redo'><IoMdRedo /></button>
                            {
                                crop && <button onClick={imageCrop} className='crop'>Crop Image</button>
                            }
                            <label htmlFor="choose">Choose Image</label>
                            <input onChange={imageHandle} type="file" accept="image/*" id='choose' />
                        </div>
                    </div>
                </div>
            </div>

            {/* Menampilkan Prediksi */}
            {prediction && <div className="prediction_result">
                <h3>Prediction: {prediction}</h3>
            </div>}
        </div>
    );
};

export default Main;
