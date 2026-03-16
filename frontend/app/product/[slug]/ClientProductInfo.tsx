"use client";

import { useState, useEffect } from "react";
// 🚨 ĐÃ ĐỔI SANG DÙNG ZUSTAND
import { useCartStore } from "../../store/useCartStore"; 
import { useFavorites } from "../../context/FavoritesContext";
import toast from "react-hot-toast";
import { Star, Heart, Ruler, ChevronDown, X, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ClientProductInfo({ product }: { product: any }) {
  // 🚨 GỌI HÀM TỪ ZUSTAND
  const addToCart = useCartStore((state) => state.addToCart);
  const { toggleFavorite, isFavorite } = useFavorites();

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [showFavModal, setShowFavModal] = useState(false);
  
  const isFav = isFavorite(product?.id);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants[0];
      setSelectedColor(defaultVariant?.color || null);
      setMainImageIndex(0);
    }
  }, [product]);

  const handleColorChange = (color: any) => {
    setSelectedColor(color);
    setSelectedSize(null);
    setMainImageIndex(0); 
  };

  let currentGalleryImages = ['/placeholder.png'];
  if (product?.images && product.images.length > 0) {
    const filteredImages = product.images.filter((img: any) => selectedColor && img.color_id === selectedColor.id).map((img: any) => img.image_url);
    if (filteredImages.length > 0) {
      currentGalleryImages = filteredImages;
    } else {
      currentGalleryImages = product.images.map((img: any) => img.image_url);
    }
  } else if (product?.base_image_url) {
    currentGalleryImages = [product.base_image_url];
  }

  const uniqueColors = product?.variants?.reduce((acc: any[], current: any) => {
    if (current?.color && !acc.find((item: any) => item.id === current.color.id)) {
      return acc.concat([current.color]);
    }
    return acc;
  }, []) || [];

  const availableVariants = product?.variants
    ?.filter((v: any) => v?.color?.id === selectedColor?.id)
    .sort((a: any, b: any) => {
      const sizeA = parseFloat(a.size?.name?.replace(/[^\d.-]/g, '') || '0');
      const sizeB = parseFloat(b.size?.name?.replace(/[^\d.-]/g, '') || '0');
      return sizeA - sizeB;
    }) || [];
    
  const selectedVariant = availableVariants.find((v: any) => v?.size?.id === selectedSize?.id);

  const nextImage = () => setMainImageIndex((prev) => (prev + 1) % currentGalleryImages.length);
  const prevImage = () => setMainImageIndex((prev) => (prev - 1 + currentGalleryImages.length) % currentGalleryImages.length);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Vui lòng chọn Kích cỡ!");
      return;
    }
    if (selectedVariant?.current_stock === 0) {
      toast.error("Phân loại này đã hết hàng.");
      return;
    }

    // 🚨 FORMAT DỮ LIỆU ĐẨY VÀO ZUSTAND
    addToCart({
      variant_id: selectedVariant.id,
      product_id: product?.id,
      name: product?.name || 'Sản phẩm', 
      price: selectedVariant.price,
      image: currentGalleryImages[0],
      color: selectedColor?.name || '', 
      size: selectedSize?.name || '',   
      quantity: 1,
      stock: selectedVariant.current_stock // Gửi luôn tồn kho vào để check vượt quá
    });
  };

  const handleToggleFavorite = () => {
    const isAdded = toggleFavorite({
      product_id: product?.id,
      product_name: product?.name || 'Sản phẩm',
      category_name: "Giày Nam",
      price: selectedVariant ? selectedVariant.price : (product?.variants?.[0]?.price || 0),
      image: currentGalleryImages[0],
      slug: product?.slug,
    });

    if (isAdded) {
      setShowFavModal(true);
      setTimeout(() => setShowFavModal(false), 5000);
    } else {
      toast.success("Đã xóa khỏi Yêu thích");
    }
  };

  if (!product) {
    return <div className="min-h-[60vh] flex items-center justify-center font-medium text-lg">Đang tải dữ liệu sản phẩm...</div>;
  }

  return (
    <div suppressHydrationWarning className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white">
      {/* 🌟 CỘT TRÁI: GALLERY ẢNH */}
      <div className="lg:col-span-7 lg:pr-10 pt-10 lg:pt-0">
        <div className="flex flex-row gap-4 sticky top-24">
          <div className="w-[60px] shrink-0 flex flex-col gap-2.5 h-[580px] overflow-y-auto [&::-webkit-scrollbar]:hidden pr-1 pb-4">
            {currentGalleryImages.map((img: string, idx: number) => (
              <button 
                key={idx} 
                onMouseEnter={() => setMainImageIndex(idx)}
                onClick={() => setMainImageIndex(idx)}
                className={`relative aspect-square rounded-md overflow-hidden bg-[#F6F6F6] transition-all duration-200 shrink-0
                  ${idx === mainImageIndex ? 'border-[1.5px] border-black' : 'border border-transparent hover:border-gray-300'}`}
              >
                <img src={img || '/placeholder.png'} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-[#F6F6F6] rounded-xl relative h-[580px] flex items-center justify-center overflow-hidden group">
            <img src={currentGalleryImages[mainImageIndex] || '/placeholder.png'} alt={product?.name || 'Sản phẩm'} className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300 ease-in-out" />
            <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <button onClick={prevImage} className="bg-white p-3.5 rounded-full shadow-md hover:bg-gray-100 transition-colors flex items-center justify-center">
                <ChevronLeft size={20} strokeWidth={1.5} className="text-gray-900" />
              </button>
              <button onClick={nextImage} className="bg-white p-3.5 rounded-full shadow-md hover:bg-gray-100 transition-colors flex items-center justify-center">
                <ChevronRight size={20} strokeWidth={1.5} className="text-gray-900" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 CỘT PHẢI: PRODUCT INFO */}
      <div className="lg:col-span-5 pt-10 lg:pt-0 lg:px-10 pb-20">
        <div className="sticky top-28 space-y-8">
          <div className="pb-4">
            <h1 className="text-[32px] font-medium text-gray-900 leading-tight tracking-tight">{product?.name || 'Sản phẩm'}</h1>
            <p className="text-gray-900 font-medium text-lg mt-1">Giày Nam</p>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-[24px] font-medium text-gray-900">
                {selectedVariant 
                  ? Number(selectedVariant.price).toLocaleString('vi-VN') 
                  : Number(product?.variants?.[0]?.price || 0).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {uniqueColors.length > 1 && (
            <div className="py-2">
              <div className="flex flex-wrap gap-2.5">
                {uniqueColors.map((color: any) => {
                  const isSelected = selectedColor?.id === color.id;
                  const colorImg = product.images?.find((img: any) => img.color_id === color.id)?.image_url || product?.base_image_url;
                  return (
                    <button 
                      key={color.id}
                      onClick={() => handleColorChange(color)}
                      className={`w-[70px] h-[70px] rounded-lg overflow-hidden border-2 transition-all bg-[#F6F6F6]
                        ${isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-300'}`}
                      title={color.name}
                    >
                      <img src={colorImg || '/placeholder.png'} alt={color.name} className="w-full h-full object-contain mix-blend-multiply p-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="py-2">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-gray-900 text-base">Chọn Kích Cỡ</p>
              <Link href="/size-guide" target="_blank" className="text-gray-500 hover:text-black font-bold text-sm flex items-center gap-1.5 transition-colors uppercase tracking-widest underline underline-offset-4">
                Size Guide <Ruler size={15}/>
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {availableVariants.map((variant: any) => {
                const isOutOfStock = variant.current_stock === 0;
                const isSelected = selectedSize?.id === variant.size.id;
                return (
                  <button
                    key={variant.size.id}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`py-4 rounded-md font-medium text-base transition-all flex items-center justify-center border text-center
                      ${isOutOfStock ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-200' : isSelected ? 'border-gray-900 ring-1 ring-gray-900 text-gray-900' : 'border-gray-200 text-gray-900 hover:border-gray-900'}`}
                  >
                    {variant?.size?.name?.replace(/[^\d.-]/g, '') || ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3.5 pt-4">
            <button onClick={handleAddToCart} className="w-full bg-black text-white hover:bg-gray-800 font-medium py-5 rounded-full transition-colors text-lg active:scale-[0.98]">
              Thêm vào Giỏ hàng
            </button>
            <button onClick={handleToggleFavorite} className="w-full bg-white text-gray-900 border border-gray-300 hover:border-gray-900 font-medium py-5 rounded-full transition-colors flex justify-center items-center gap-2.5 text-lg active:scale-[0.98]">
              {isFav ? 'Đã yêu thích' : 'Yêu thích'} <Heart size={20} className={isFav ? "fill-black text-black" : "text-gray-900"} />
            </button>
          </div>
          
          <div className="pt-10 pb-6 border-t border-gray-100 mt-10">
            <p className="text-gray-900 text-base leading-relaxed font-medium mb-6">{product?.description || 'Chưa có mô tả cho sản phẩm này.'}</p>
            <ul className="space-y-2.5 text-base text-gray-900 font-medium list-disc pl-5 marker:text-gray-900">
              <li>Màu sắc hiển thị: <span className="text-gray-600">{selectedColor?.name || 'Đang cập nhật'}</span></li>
              <li>Mã sản phẩm: <span className="uppercase text-gray-600">{selectedVariant?.sku || 'Đang cập nhật'}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}