import mongoose from 'mongoose';

const BuildingSchema = new mongoose.Schema({
  'type': {
    type: String,
    required: true,
    enum: ['Feature'],
    default: 'Feature'
  },
  'properties': {
    'OBJECTID': {
      type: String,
      index: true
    },
    'ID': String,
    'RegisterNo': String,
    'ParentRegisterNo': String,
    'Classifier': String,
    'Код_объекта': String,
    'Наименование': String,
    'Название_улицы': String,
    'Номер_дома': String,
    'Полное_название': String,
    'Год_ввода_в_эксплуатацию': String,
    'Проектная_мощность': String,
    'ФИО_Директора': String,
    'Количество_реально': String,
    'Площадь': Number,
    'телефон_приемная': String,
    'этажность': {
      type: String,
      default: '5'
    },
    'edited': {
      type: Boolean,
      default: false
    }
  },
  'geometry': {}
});

export default mongoose.model('Building', BuildingSchema);
