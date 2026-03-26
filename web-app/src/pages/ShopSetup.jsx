import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { geocodeAddress, roundCoord } from '../utils/geo.utils';

import {
  createShop,
  updateShop,
  getMyShops,
  toggleShopOpen
} from '../services/shop.service';

import { mapShopToFormValues } from '../utils/shop.mapper';
import LocationSection from '../components/LocationSection';

const defaultValues = {
  shopName: '',
  ownerName: '',
  description: '',

  address: {
    shopNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  },

  contactInfo: {
    phone: '',
    email: ''
  },

  upi: {
    id: '',
    displayName: ''
  },

  printingServices: {
    blackWhite: { singleSidedPrice: 0, doubleSidedPrice: 0 },
    color: { singleSidedPrice: 0, doubleSidedPrice: 0 }
  },

  workingHours: {
    monday:    { isOpen: true,  open: '09:00', close: '21:00' },
    tuesday:   { isOpen: true,  open: '09:00', close: '21:00' },
    wednesday: { isOpen: true,  open: '09:00', close: '21:00' },
    thursday:  { isOpen: true,  open: '09:00', close: '21:00' },
    friday:    { isOpen: true,  open: '09:00', close: '21:00' },
    saturday:  { isOpen: true,  open: '09:00', close: '21:00' },
    sunday:    { isOpen: false, open: '',      close: '' }
  },

  location: { lat: null, lng: null }
};

const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100';

export default function ShopSetup() {
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(false);
  const [isScheduleAllClosed, setIsScheduleAllClosed] = useState(false);
  const [isTodayScheduleOpen, setIsTodayScheduleOpen] = useState(true);
  const [shopImage, setShopImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } =
    useForm({ defaultValues });

  const lat = watch('location.lat');
  const lng = watch('location.lng');
  const address = watch('address');
  const workingHours = watch('workingHours');

  const getTodayKey = () => {
    return new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
  };

  useEffect(() => {
    if (!workingHours) {
      return;
    }

    const allClosed = Object.values(workingHours).every(
      (day) => !day?.isOpen
    );
    setIsScheduleAllClosed(allClosed);

    const todayKey = getTodayKey();
    const todayConfig = workingHours[todayKey];
    setIsTodayScheduleOpen(Boolean(todayConfig?.isOpen));
  }, [workingHours]);


  const fetchMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('location.lat', roundCoord(pos.coords.latitude));
        setValue('location.lng', roundCoord(pos.coords.longitude));
        setIsFetchingLocation(false);
      },
      () => {
        toast.error('Unable to fetch your location');
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const loadShop = async () => {
    try {
      const res = await getMyShops();
      const shops = res.data || [];

      if (shops.length > 0) {
        const shop = shops[0];
        setShopId(shop._id);

        // Load existing shop image
        if (shop.image) {
          setImagePreview(shop.image);
        }

        const mapped = mapShopToFormValues(shop);
        reset(mapped);
        setSavedSnapshot(mapped);

        const sourceWorkingHours = shop.workingHours || mapped.workingHours || {};
        const originalClosed = Object.values(sourceWorkingHours).every(
          (day) => !day?.isOpen
        );
        setIsScheduleAllClosed(originalClosed);

        const todayKey = getTodayKey();
        setIsTodayScheduleOpen(Boolean(sourceWorkingHours[todayKey]?.isOpen));
      }
    } catch {
      toast.error('Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, []);


  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      let { lat, lng } = data.location || {};

      // If location is not set, try geocoding the address section.
      if ((lat == null || lng == null) && address) {
        setIsGeocoding(true);
        try {
          const loc = await geocodeAddress(address);
          if (loc) {
            lat = loc.lat;
            lng = loc.lng;
            setValue('location.lat', roundCoord(lat));
            setValue('location.lng', roundCoord(lng));
          }
        } finally {
          setIsGeocoding(false);
        }
      }

      if (lat != null && lng != null) {
        payload.location = {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)]
        };
      } else {
        delete payload.location;
      }

      if (shopId) {
        await updateShop(shopId, payload);
        toast.success('Shop updated');
      } else {
        await createShop(payload);
        toast.success('Shop created');
      }

      setIsEditing(false);
      await loadShop(); // soft refresh
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Operation failed';

      const validation =
        err.response?.data?.validation?.length > 0
          ? err.response.data.validation.join(', ')
          : null;

      toast.error(validation ? `${message}: ${validation}` : message);
    }
  };

  const handleToggleOpen = async () => {
    if (!isTodayScheduleOpen) {
      toast.error(
        'Today is scheduled closed, temporary open/close toggle is disabled.'
      );
      return;
    }

    try {
      const res = await toggleShopOpen(shopId);
      setIsTemporaryClosed(res.data.isTemporaryClosed);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to toggle shop status');
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setShopImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadShopImage = async () => {
    if (!shopImage || !shopId) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', shopImage);

      const response = await fetch(`http://localhost:5000/api/shops/${shopId}/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setImagePreview(result.imageUrl);
      setShopImage(null);
      toast.success('Shop image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setShopImage(null);
    setImagePreview(null);
  };

  const cancelEdit = () => {
    if (savedSnapshot) {
      reset(savedSnapshot);
    }
    setIsEditing(false);
  };

  if (loading) {
    return <p className="text-center mt-10">Loading…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {shopId ? 'Shop Details' : 'Create Shop'}
          </h1>
          {shopId && (
            <p className="text-sm text-gray-600 mt-1">
              Status: <span className={(!isTodayScheduleOpen || isTemporaryClosed) ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                {!isTodayScheduleOpen
                  ? 'Closed (scheduled off)'
                  : isTemporaryClosed
                  ? 'Closed (temporarily closed)'
                  : 'Open'}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {shopId && (
            <button
              onClick={handleToggleOpen}
              disabled={!isTodayScheduleOpen}
              className={`px-4 py-2 rounded text-white ${
                !isTodayScheduleOpen
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isTemporaryClosed
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {!isTodayScheduleOpen
                ? 'Unavailable (today closed)'
                : isTemporaryClosed
                ? 'Open Shop'
                : 'Close for Today'}
            </button>
          )}

          {shopId && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-800 text-white rounded"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* SHOP INFO */}
        <Section title="Shop Information">
          <Field label="Shop Name *">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('shopName')} />
          </Field>

          <Field label="Owner Name *">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('ownerName')} />
          </Field>

          <Field label="Description">
            <textarea className={inputClass} rows={3} disabled={!isEditing && shopId} {...register('description')} />
          </Field>

          {/* Shop Image Upload */}
          <Field label="Shop Image">
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Shop"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  {(isEditing || !shopId) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {(isEditing || !shopId) && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {shopImage && (
                    <button
                      type="button"
                      onClick={uploadShopImage}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-500">
                Upload a photo of your shop. Max size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </Field>
        </Section>

        {/* ADDRESS */}
        <Section title="Address">
          {[
            ['Shop / Flat Number', 'address.shopNumber'],
            ['Street', 'address.street'],
            ['City *', 'address.city'],
            ['State *', 'address.state'],
            ['Pincode *', 'address.pincode']
          ].map(([label, name]) => (
            <Field key={name} label={label}>
              <input className={inputClass} disabled={!isEditing && shopId} {...register(name)} />
            </Field>
          ))}
        </Section>

        {/* CONTACT */}
        <Section title="Contact Information">
          <Field label="Phone *">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('contactInfo.phone')} />
          </Field>

          <Field label="Email">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('contactInfo.email')} />
          </Field>
        </Section>

        <Section title="Printing Prices (₹)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="B/W Single Sided (per page)">
              <input
                type="number"
                min="0"
                className={inputClass}
                disabled={!isEditing && shopId}
                {...register('printingServices.blackWhite.singleSidedPrice')}
              />
            </Field>

            <Field label="B/W Double Sided (per page)">
              <input
                type="number"
                min="0"
                className={inputClass}
                disabled={!isEditing && shopId}
                {...register('printingServices.blackWhite.doubleSidedPrice')}
              />
            </Field>

            <Field label="Color Single Sided (per page)">
              <input
                type="number"
                min="0"
                className={inputClass}
                disabled={!isEditing && shopId}
                {...register('printingServices.color.singleSidedPrice')}
              />
            </Field>

            <Field label="Color Double Sided (per page)">
              <input
                type="number"
                min="0"
                className={inputClass}
                disabled={!isEditing && shopId}
                {...register('printingServices.color.doubleSidedPrice')}
              />
            </Field>
          </div>
        </Section>


        {/* UPI */}
        <Section title="UPI Details">
          <Field label="UPI ID">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('upi.id')} />
          </Field>

          <Field label="Display Name">
            <input className={inputClass} disabled={!isEditing && shopId} {...register('upi.displayName')} />
          </Field>
        </Section>

        {/* LOCATION */}
        <Section title="Shop Location">
          <div className="flex flex-col gap-3 mb-4">
            <button
              type="button"
              onClick={fetchMyLocation}
              disabled={isFetchingLocation}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {isFetchingLocation ? 'Fetching…' : 'Use my location'}
            </button>
          </div>

          <LocationSection
            lat={lat}
            lng={lng}
            isEditing={isEditing || !shopId}
            onChange={(lat, lng) => {
              setValue('location.lat', roundCoord(lat));
              setValue('location.lng', roundCoord(lng));
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude">
              <input type="number" step="0.000001" className={inputClass} disabled={!isEditing && shopId} {...register('location.lat')} />
            </Field>

            <Field label="Longitude">
              <input type="number" step="0.000001" className={inputClass} disabled={!isEditing && shopId} {...register('location.lng')} />
            </Field>
          </div>
        </Section>

        {/* WORKING HOURS */}
        <Section title="Working Hours">
          <div className="space-y-4">
            {[
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday'
            ].map((day) => (
              <div
                key={day}
                className="grid grid-cols-4 gap-4 items-center"
              >
                <span className="capitalize font-medium">
                  {day}
                </span>

                <input
                  type="checkbox"
                  {...register(`workingHours.${day}.isOpen`)}
                  disabled={!isEditing && shopId}
                />

                <input
                  type="time"
                  className={inputClass}
                  disabled={
                    !isEditing ||
                    !watch(`workingHours.${day}.isOpen`)
                  }
                  {...register(`workingHours.${day}.open`)}
                />

                <input
                  type="time"
                  className={inputClass}
                  disabled={
                    !isEditing ||
                    !watch(`workingHours.${day}.isOpen`)
                  }
                  {...register(`workingHours.${day}.close`)}
                />
              </div>
            ))}
          </div>
        </Section>

        {(isEditing || !shopId) && (
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded">
              Save
            </button>

            {shopId && (
              <button type="button" onClick={cancelEdit} className="px-6 py-2 bg-gray-300 rounded">
                Cancel
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function Section({ title, children }) {
  return (
    <section className="border p-4 rounded space-y-4">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}