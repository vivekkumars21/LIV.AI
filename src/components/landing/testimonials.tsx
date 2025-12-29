import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const testimonials = [
  {
    id: 'sophia-turner',
    name: 'Sophia Turner',
    date: 'May 15, 2024',
    rating: 5,
    text: 'IntraKart has completely transformed my living room! The AI suggestions were spot-on, and the AR feature helped me visualize everything perfectly before making a purchase. Highly recommend!',
    likes: 12,
    comments: 2,
    avatarId: 'avatar-sophia',
  },
  {
    id: 'ethan-walker',
    name: 'Ethan Walker',
    date: 'April 22, 2024',
    rating: 4,
    text: 'The platform is user-friendly and offers a great selection of furniture. The AR feature is a game-changer, though I wish there were more design options available.',
    likes: 8,
    comments: 1,
    avatarId: 'avatar-ethan',
  },
  {
    id: 'olivia-reed',
    name: 'Olivia Reed',
    date: 'March 10, 2024',
    rating: 5,
    text: 'I love the variety of styles and the quality of the furniture. The customer service was excellent, and the delivery was prompt. IntraKart made decorating my new apartment a breeze!',
    likes: 15,
    comments: 0,
    avatarId: 'avatar-olivia',
  },
];

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.287 3.96c.3.921-.755 1.688-1.54 1.118l-3.365-2.446a1 1 0 00-1.176 0l-3.365 2.446c-.784.57-1.838-.197-1.54-1.118l1.287-3.96a1 1 0 00-.364-1.118L2.05 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z" />
  </svg>
);

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-3xl font-bold tracking-tight text-center">
          What Our Customers Say
        </h2>
        <div className="mt-12 space-y-12">
          {testimonials.map(testimonial => {
            const avatar = PlaceHolderImages.find(img => img.id === testimonial.avatarId);
            return (
              <div key={testimonial.id} className="flex gap-4 p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/30 shadow-sm hover:shadow-md transition-all">
                {avatar && (
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage src={avatar.imageUrl} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.date}</p>
                    </div>
                    <div className="flex items-center bg-white/50 px-2 py-1 rounded-full">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} filled={i < testimonial.rating} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-light">{testimonial.text}</p>
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{testimonial.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      <span>{testimonial.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
